let lastPlayAt = 0
const MIN_INTERVAL_MS = 1200

/**
 * 前台消息提示音（不与背景音乐抢音频焦点）
 * - Android：系统「通知」铃声通道（TYPE_NOTIFICATION）
 * - iOS：AVAudioSession ambient + mixWithOthers，短音与音乐并存
 */
export function playNotificationSound() {
  const now = Date.now()
  if (now - lastPlayAt < MIN_INTERVAL_MS) return
  lastPlayAt = now

  // #ifdef APP-PLUS
  try {
    if (plus.os.name === 'Android') {
      playAndroidNotificationRingtone()
      return
    }
    if (plus.os.name === 'iOS') {
      playIosAmbientSound()
      return
    }
  } catch (e) {
    console.warn('[notifySound] play failed', e)
  }
  // #endif
}

/** Android 通知铃声，走 STREAM_NOTIFICATION，一般不打断正在播放的音乐 */
function playAndroidNotificationRingtone() {
  const main = plus.android.runtimeMainActivity()
  const RingtoneManager = plus.android.importClass('android.media.RingtoneManager')
  const uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
  if (!uri) return
  const ringtone = RingtoneManager.getRingtone(main, uri)
  if (ringtone) {
    ringtone.play()
  }
}

/** iOS：ambient 会话允许与 Spotify 等混播 */
function playIosAmbientSound() {
  const AVAudioSession = plus.ios.importClass('AVAudioSession')
  const session = AVAudioSession.sharedInstance()
  // mixWithOthers = 1，ambient 类别可与其它 App 混播
  session.setCategoryWithOptions_error('AVAudioSessionCategoryAmbient', 1, null)
  session.setActive_error(true, null)

  const path = plus.io.convertLocalFileSystemURL('/static/notify.mp3')
  const NSURL = plus.ios.importClass('NSURL')
  const url = NSURL.URLWithString(path)
  if (!url) return

  const AVAudioPlayer = plus.ios.importClass('AVAudioPlayer')
  const player = AVAudioPlayer.alloc().initWithContentsOfURL_error(url, null)
  if (!player) return

  player.setVolume(0.85)
  player.prepareToPlay()
  player.play()

  setTimeout(() => {
    try {
      player.stop()
      plus.ios.deleteObject(player)
    } catch (e) {}
  }, 3000)
}

export function destroyNotificationSound() {
  // 无长期持有播放器，无需销毁
}
