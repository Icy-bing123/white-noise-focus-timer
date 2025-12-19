/**
 * 倒计时管理器类
 * 功能：管理目标日期，计算并更新倒计时显示
 */
/**
 * 倒计时管理器类
 * 功能：管理目标日期，计算并更新倒计时显示
 */
class CountdownManager {
    /**
     * 构造函数
     * @param {Object} options 配置选项
     * @param {string} options.targetDate 目标日期（YYYY-MM-DD格式）
     * @param {Function} options.onUpdate 每次更新时的回调函数
     * @param {Function} options.onComplete 倒计时结束时的回调函数
     */
    constructor(options) {
        this.targetDate = new Date(options.targetDate);
        this.onUpdate = options.onUpdate;
        this.onComplete = options.onComplete;
        this.timer = null;
        this.isRunning = false;
    }

    /**
     * 设置新的目标日期
     * @param {string} dateString YYYY-MM-DD格式的日期
     */
    setTargetDate(dateString) {
        this.targetDate = new Date(dateString);
        this.updateDisplay();
    }

    /**
     * 开始倒计时
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.timer = setInterval(() => {
            this.updateDisplay();
        }, 1000);
        this.updateDisplay(); // 立即更新一次
    }

    /**
     * 停止倒计时
     */
    stop() {
        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 获取剩余时间
     * @returns {Object} 包含天、时、分、秒的对象
     */
    getRemainingTime() {
        const now = new Date();
        const diff = this.targetDate - now;

        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }

    /**
     * 更新显示（内部方法）
     */
    updateDisplay() {
        const remaining = this.getRemainingTime();

        // 更新DOM元素
        const elDays = document.getElementById('days');
        const elHours = document.getElementById('hours');
        const elMinutes = document.getElementById('minutes');
        const elSeconds = document.getElementById('seconds');

        if (elDays) elDays.textContent = remaining.days.toString().padStart(3, '0');
        if (elHours) elHours.textContent = remaining.hours.toString().padStart(2, '0');
        if (elMinutes) elMinutes.textContent = remaining.minutes.toString().padStart(2, '0');
        if (elSeconds) elSeconds.textContent = remaining.seconds.toString().padStart(2, '0');

        // 调用更新回调
        if (this.onUpdate) {
            this.onUpdate(remaining);
        }

        // 检查是否结束
        if (remaining.days === 0 && remaining.hours === 0 &&
            remaining.minutes === 0 && remaining.seconds === 0) {
            this.stop();
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    /**
     * 获取进度百分比
     * @returns {number} 0-100的百分比
     */
    getProgressPercentage() {
        // 假设一个起始日期，实际项目中可能需要配置或动态获取
        const startDate = new Date('2024-01-01');
        const totalDuration = this.targetDate - startDate;
        const elapsed = new Date() - startDate;

        // 避免除以零或未来日期导致的负数（虽然在这个逻辑下 elapsed 增加 percentage 增加）
        // 用户原始代码逻辑：
        // const elapsed = this.targetDate - new Date(); // 这是剩余时间
        // const percentage = ((totalDuration - elapsed) / totalDuration) * 100;
        // 重写以匹配用户提供的逻辑意图：

        const totalDurationMs = this.targetDate - new Date('2024-01-01');
        const remainingMs = this.targetDate - new Date();
        const percentage = ((totalDurationMs - remainingMs) / totalDurationMs) * 100;

        return Math.min(Math.max(percentage, 0), 100);
    }
}

/**
 * 白噪音播放器核心类
 * 功能全覆盖：音频加载/播放/暂停/切换/音量/定时
 */
class AudioPlayer {
  constructor(config) {
    // 基础配置
    this.sounds = config.sounds;
    this.currentSound = null;
    this.audioElements = {};
    this.isPlaying = false;
    this.volume = config.initialVolume || 80;
    this.timer = null;
    this.timerDuration = null;

    // 初始化流程
    this.initAudio();
    this.bindDOMEvents();
    this.initDefaultUI();
  }

  /**
   * 1. 初始化音频资源（预加载+错误处理）
   */
  initAudio() {
    Object.keys(this.sounds).forEach(soundKey => {
      const audio = new Audio(this.sounds[soundKey].url);
      audio.loop = true;       // 循环播放
      audio.volume = this.volume / 100;  // 初始音量
      audio.preload = 'auto';  // 预加载

      // 音频加载错误监听
      audio.addEventListener('error', (e) => {
        console.error(`[音频加载失败] ${soundKey}:`, e);
        this.showToast(`音效「${this.sounds[soundKey].name}」加载失败，请检查文件`);
      });

      // 缓存音频实例
      this.audioElements[soundKey] = audio;
    });
  }

  /**
   * 2. 绑定所有DOM事件（核心交互逻辑）
   */
  bindDOMEvents() {
    // 播放/暂停按钮点击
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const selectedKey = document.getElementById('sound-select').value;
        this.togglePlay(selectedKey);
      });
    }

    // 音效选择下拉框切换
    const soundSelect = document.getElementById('sound-select');
    if (soundSelect) {
      soundSelect.addEventListener('change', (e) => {
        const newSoundKey = e.target.value;
        // 如果正在播放，切换音效；否则仅更新UI
        if (this.isPlaying) {
          this.play(newSoundKey);
        } else {
          this.currentSound = newSoundKey;
          this.updateUI();
        }
      });
    }

    // 音量滑块调节
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.setVolume(Number(e.target.value));
      });
    }

    // 定时关闭按钮点击
    const timerBtn = document.getElementById('timer-btn');
    if (timerBtn) {
      timerBtn.addEventListener('click', () => {
        this.openTimerModal();
      });
    }

    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
      this.stopAll();
      this.clearTimer();
    });
  }

  /**
   * 3. 初始化默认UI（页面加载时显示第一个音效）
   */
  initDefaultUI() {
    this.currentSound = 'rain'; // 默认选中雨滴
    this.updateUI();
    this.setVolume(this.volume); // 初始化音量显示
  }

  /**
   * 4. 播放指定音效（核心播放逻辑）
   * @param {string} soundKey 音效标识（rain/waves/fire/cafe）
   */
  play(soundKey) {
    // 停止当前播放的音效（如果切换音效）
    if (this.currentSound && this.currentSound !== soundKey) {
      this.pause(this.currentSound);
    }

    const audio = this.audioElements[soundKey];
    if (!audio) return;

    // 解决浏览器自动播放限制（必须用户交互触发）
    audio.play().then(() => {
      this.currentSound = soundKey;
      this.isPlaying = true;
      this.updateUI();
    }).catch((e) => {
      console.error('[播放失败] 浏览器自动播放限制:', e);
      this.showToast('请先点击"开始专注"按钮手动播放');
    });
  }

  /**
   * 5. 暂停指定音效
   * @param {string} soundKey 音效标识
   */
  pause(soundKey) {
    const audio = this.audioElements[soundKey];
    if (audio && !audio.paused) {
      audio.pause();
      this.isPlaying = false;
      this.updateUI();
    }
  }

  /**
   * 6. 切换播放/暂停状态
   * @param {string} soundKey 音效标识
   */
  togglePlay(soundKey) {
    const audio = this.audioElements[soundKey];
    if (!audio) return;

    audio.paused ? this.play(soundKey) : this.pause(soundKey);
  }

  /**
   * 7. 设置音量（0-100）
   * @param {number} volume 音量值
   */
  setVolume(volume) {
    // 边界值处理
    this.volume = Math.max(0, Math.min(100, volume));

    // 更新所有音频的音量
    Object.values(this.audioElements).forEach(audio => {
      audio.volume = this.volume / 100;
    });

    // 更新音量UI
    const volumeValue = document.getElementById('volume-value');
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeValue) volumeValue.textContent = `${this.volume}%`;
    if (volumeSlider) volumeSlider.value = this.volume;
  }

  /**
   * 8. 打开定时选择弹窗（友好交互）
   */
  openTimerModal() {
    const timerOptions = [5, 10, 15, 20, 30, 60]; // 可选分钟数
    const selected = prompt(
      `请选择定时关闭时长（分钟）：\n${timerOptions.join('、')}`,
      '30'
    );

    const minutes = Number(selected);
    if (!isNaN(minutes) && minutes > 0) {
      this.setTimer(minutes);
      this.showToast(`已设置${minutes}分钟后自动关闭`);
    } else if (selected !== null) {
      this.showToast('请输入有效的数字（如：5/10/30）');
    }
  }

  /**
   * 9. 设置定时关闭
   * @param {number} minutes 分钟数
   */
  setTimer(minutes) {
    // 清除已有定时器
    this.clearTimer();

    // 转换为毫秒
    const duration = minutes * 60 * 1000;
    this.timer = setTimeout(() => {
      this.stopAll();
      this.showToast(`定时结束！已停止播放（共${minutes}分钟）`);
    }, duration);
    this.timerDuration = duration;
  }

  /**
   * 10. 清除定时器
   */
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      this.timerDuration = null;
    }
  }

  /**
   * 11. 停止所有音效播放
   */
  stopAll() {
    Object.values(this.audioElements).forEach(audio => {
      audio.pause();
      audio.currentTime = 0; // 重置播放进度
    });
    this.isPlaying = false;
    this.currentSound = null;
    this.clearTimer();
    this.updateUI();
  }

  /**
   * 12. 更新UI显示（核心UI同步逻辑）
   */
  updateUI() {
    // 播放按钮状态
    const playBtn = document.getElementById('play-btn');
    if (!playBtn || !this.currentSound) return;

    const playIcon = playBtn.querySelector('i');
    const playText = playBtn.querySelector('span');
    const soundConfig = this.sounds[this.currentSound];

    // 更新音效图标/名称/描述
    const soundIcon = document.getElementById('current-sound-icon');
    const soundName = document.getElementById('current-sound-name');
    const soundDesc = document.getElementById('current-sound-desc');
    const soundSelect = document.getElementById('sound-select');

    if (soundIcon) soundIcon.className = soundConfig.icon;
    if (soundName) soundName.textContent = soundConfig.name;
    if (soundDesc) soundDesc.textContent = soundConfig.desc;
    if (soundSelect) soundSelect.value = this.currentSound;

    // 更新播放按钮状态
    if (this.isPlaying) {
      playIcon.className = 'fas fa-pause-circle';
      playText.textContent = '暂停专注';
    } else {
      playIcon.className = 'fas fa-play-circle';
      playText.textContent = '开始专注';
    }
  }

  /**
   * 13. 轻提示（替代alert，更友好）
   * @param {string} message 提示文本
   */
  showToast(message) {
    // 创建/获取提示框
    let toast = document.getElementById('audio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'audio-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }

    // 显示提示
    toast.textContent = message;
    toast.style.opacity = '1';

    // 3秒后隐藏
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  }
}

// ===================== 全局初始化逻辑 =====================
// 音效配置（与HTML下拉框对应）
const SOUND_CONFIG = {
  rain: {
    url: 'sounds/rain.mp3',
    icon: 'fas fa-cloud-rain',
    name: '细雨',
    desc: '轻柔雨滴声，帮助集中注意力'
  },
  waves: {
    url: 'sounds/waves.mp3',
    icon: 'fas fa-water',
    name: '海浪',
    desc: '海岸涛声，舒缓放松'
  },
  fire: {
    url: 'sounds/fire.mp3',
    icon: 'fas fa-fire',
    name: '篝火',
    desc: '噼啪燃烧声，温暖安心'
  },
  cafe: {
    url: 'sounds/cafe.mp3',
    icon: 'fas fa-coffee',
    name: '咖啡馆',
    desc: '背景交谈声，创造工作氛围'
  }
};

// 统一的页面初始化入口（避免重复监听DOMContentLoaded）
document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化白噪音播放器
  window.audioPlayer = new AudioPlayer({
    sounds: SOUND_CONFIG,
    initialVolume: 80
  });

  // 2. 初始化倒计时管理器（如果HTML中未初始化）
  // 注：HTML中已有倒计时初始化逻辑，这里做兜底，避免重复创建
  if (!window.countdownManager) {
    const targetDateElem = document.getElementById('target-date');
    const currentTarget = targetDateElem ? targetDateElem.textContent : '2025-12-31';

    window.countdownManager = new CountdownManager({
      targetDate: currentTarget,
      onUpdate: (time) => {},
      onComplete: () => {
        alert('倒计时结束！');
      }
    });
    window.countdownManager.start();
  }

  // 3. 音量滑块同步（兜底逻辑）
  const volumeSlider = document.getElementById('volume-slider');
  const volumeValue = document.getElementById('volume-value');
  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', () => {
      volumeValue.textContent = `${volumeSlider.value}%`;
    });
  }
});