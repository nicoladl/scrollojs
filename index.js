import Vue from 'vue'
import { TweenMax, Power4 } from 'gsap'
import normalizeWheel from 'normalize-wheel'
import MobileDetect from 'mobile-detect'

export default function SimpleModule(moduleOptions) {
  Vue.prototype.$scroll = () => {
    const easeOut = Power4.easeOut

    const scroller = {
      target: moduleOptions.target, // document.querySelector('.js-scroller'),
      targetHeight: moduleOptions.targetHeight, // 0,
      y: moduleOptions.y, //0,
      resizeRequest: moduleOptions.resizeRequest,
      offsetSkew: moduleOptions.offsetSkew, // 0.025
      minSpinSkew: moduleOptions.minSpinSkew, // 0.5
      scrollSpeed: moduleOptions.scrollSpeed, // 1s
      mobileScrollRatio: moduleOptions.mobileScrollRatio // 4
    }

    TweenMax.set(scroller.target, {
      force3D: true
    })

    // offset to determinate Scale bounds
    // const offsetSkew = 0.025

    // min spin to init scale
    // const minSpinSkew = 0.5

    // min page height to init scale
    let minBoundPageHeight = window.innerHeight * 2

    // window height
    let wh = scroller.targetHeight - window.innerHeight
    // const scrollSpeed = 1
    // const mobileScrollRatio = 4

    // TweenMax.set(['.scroller', '.scroller__item'], { y: 0 })

    let scrolled = 0
    let pixelY = 0
    let preDelta = 0
    let delta = 0
    let wheeling

    let ts, te
    const md = new MobileDetect(window.navigator.userAgent)

    // init scroll listner after image load
    window.addEventListener('resize', onResize)

    if (md.mobile()) {
      document.addEventListener('touchstart', e => {
          ts = e.targetTouches[0].pageY
        }, { passive: true }
      )

      document.addEventListener('touchend', e => {
          preDelta = 0
        }, { passive: true }
      )
      document.addEventListener('touchmove', onMouseWhell, { passive: true })
    } else {
      document.addEventListener('mousewheel', onMouseWhell, { passive: true })
      document.addEventListener('DOMMouseScroll', onMouseWhell, { passive: true })
    }

    function onResize() {
      minBoundPageHeight = window.innerHeight * 2
      scroller.targetHeight = scroller.target.clientHeight
      wh = scroller.targetHeight - window.innerHeight

      if (scroller.y > wh) {
        scroller.y = wh
        TweenMax.to(scroller.target, 1.5, { y: -scroller.y, ease: easeOut })
      }
    }

    function onMouseWhell(e) {
      const normalized = normalizeWheel(e)
      let spinY

      clearTimeout(wheeling)
      wheeling = setTimeout(() => {
        TweenMax.to(scroller.target, 0.5, {
          skewY: 0,
          ease: easeOut
        })
      }, 250)

      if (md.mobile()) {
        te = e.targetTouches[0].pageY
        spinY = -delta // use 0 to deactivate skew on mobile
      } else {
        pixelY = normalized.pixelY
        spinY = normalized.spinY
      }

      scroller.targetHeight = scroller.target.clientHeight

      // conditions to activate scroll
      if (scroller.y >= 0 && scroller.y <= wh) {
        delta = ts - te - preDelta

        md.mobile() ? scroller.y += delta * scroller.mobileScrollRatio : scroller.y += pixelY

        // set upper bound of page
        scroller.y < 0 ? scroller.y = 0 : null

        // set lower bound of page
        scroller.y > wh ? scroller.y = wh : null

        TweenMax.to(scroller.target, scroller.scrollSpeed, {
          y: -scroller.y,
          ease: easeOut
        })

        preDelta = ts - te
      } else {
        TweenMax.to(scroller.target, 1, { scaleX: 1 })
      }

      // conditions to activate scale-content
      if (scroller.targetHeight > minBoundPageHeight && scroller.y > 0 && scroller.y < wh && Math.abs(spinY) > scroller.minSpinSkew) {
        let skew = 1 - Math.abs(spinY) * scroller.offsetSkew

        skew <= 0 ? skew = -skew : null

        TweenMax.to(scroller.target, scroller.scrollSpeed, {
          skewY: skew,
          ease: easeOut
        })
      } else {
        // reset skew
        TweenMax.to(scroller.target, scroller.scrollSpeed * 2, {
          skewY: 0,
          ease: easeOut
        })
      }

      // scroll animations
      if (scrolled >= 0 && scrolled <= scroller.targetHeight) {
        scrolled = scrolled + pixelY
      } else if (scrolled < 0) {
        scrolled = 0
      } else if (scrolled > scroller.targetHeight) {
        scrolled = scroller.targetHeight
      }
    }
  }
}

// REQUIRED if publishing the module as npm package
module.exports.meta = require('./package.json')
