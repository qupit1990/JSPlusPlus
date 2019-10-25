(function () {

  let JSPPView = JSPP.ppclass('JSPPDebugView')

  JSPPView.private.static.JSPPviewNode = null
  JSPPView.private.screenNode = null

  JSPPView.private.static.onKeyPress = function (key, event) {
    if (key === cc.KEY['p']) {
      if (this.JSPPviewNode) {
        this.JSPPviewNode.hideReloadJSPP()
      } else {
        this.JSPPviewNode = JSPP.ppnew('JSPPDebugView')
        this.JSPPviewNode.showReloadJSPP()
      }
    }
  }

  JSPPView.public.static.addPPFilesListener = function (node) {
    if (cc.sys.OS_WINDOWS !== cc.sys.os || node.JSPPEvent !== undefined) return

    node.JSPPEvent = cc.EventListener.create({
      event: cc.EventListener.KEYBOARD,
      onKeyReleased: JSPP.ppfunction(this.onKeyPress, this)
    })
    cc.eventManager.addListener(node.JSPPEvent, node)
  }

  JSPPView.private.showReloadJSPP = function () {
    if (this.viewNode) { this.hideReloadJSPP() }

    let basicfilelist = JSPP.getclassfilelist()
    let ObjAliveCountMap = JSPP.__core__.ObjAliveCountMap
    let FileClassesMap = JSPP.__core__.FileClassesMap
    let ClassChildrenMap = JSPP.__core__.ClassChildrenMap
    let filelist = []
    for (let index in basicfilelist) {
      let filename = basicfilelist[index]
      let excludeAble = true

      for (let index in FileClassesMap[filename]) {
        let classname = FileClassesMap[filename][index]

        if (ObjAliveCountMap[classname] && ObjAliveCountMap[classname] > 0) {
          excludeAble = false
          break
        }

        if (ClassChildrenMap[classname] !== undefined) {
          for (let index in ClassChildrenMap[classname]) {
            let checkChildrenClass = ClassChildrenMap[classname][index]
            if (ObjAliveCountMap[checkChildrenClass] && ObjAliveCountMap[checkChildrenClass] > 0) {
              excludeAble = false
              break
            }
          }
          if (!excludeAble) break
        }
      }
      filelist.push([filename, excludeAble])
    }

    filelist.sort(function (a, b) {
      if (a[1] && !b[1]) return -1
      else if (!a[1] && b[1]) return 1
      else return 0
    })

    let screensize = cc.director.getWinSize()
    let screen = new ccui.Layout()
    screen.setContentSize(screensize)
    screen.setBackGroundColor(cc.color(0, 0, 0, 200))
    screen.setBackGroundColorType(ccui.Layout.BG_COLOR_SOLID)
    screen.setTouchEnabled(true)

    let list = ccui.ListView.create()
    list.setDirection(ccui.ScrollView.DIR_VERTICAL)//滑动条方向
    list.setTouchEnabled(true)//触摸开启
    list.setBounceEnabled(true)//弹性开启
    list.setPosition(cc.p(screensize.width / 2, screensize.height / 2))
    list.setAnchorPoint(cc.p(0.5, 0.5))
    list.setContentSize(cc.size(screensize.width - 200, screensize.height - 200))

    let itemsize = cc.size(screensize.width - 200, 80)

    for (let i = 0; i < filelist.length; i++) {
      let item = new ccui.Layout()
      item.setContentSize(itemsize)
      item.setAnchorPoint(cc.p(0.5,0.5))
      let color
      switch (i % 3) {
        case  0:
          color = cc.color(100, 100, 100, 200)
          break
        case  1:
          color = cc.color(125, 125, 125, 200)
          break
        case  2:
          color = cc.color(150, 150, 150, 200)
          break
      }
      item.setBackGroundColor(color)
      item.setBackGroundColorType(ccui.Layout.BG_COLOR_SOLID)

      let data = filelist[i]
      if (data[1]) {
        item.setTouchEnabled(true)
        item.addTouchEventListener(function (btn, et) {
          // let glPos = et.getLocation()
          if (et === ccui.Widget.TOUCH_BEGAN) {
            item.setScale(1.1)
            // btn.start = glPos
          } else if (et === ccui.Widget.TOUCH_ENDED) {
            item.setScale(1)
            // if (btn.start && Math.abs(glPos.x - btn.start.x) < 10 && Math.abs(glPos.y - btn.start.y) < 10) {
            let filepath = data[0]
            cc.log('free file classes : [' + filepath + ']')
            JSPP.ppexclude(filepath)
            sys.cleanScript(filepath)
            JSPP.ppinclude(filepath)
            // }
          } else if (et === ccui.Widget.TOUCH_CANCELED) {
            item.setScale(1)
          }
        }, item)
      }

      let text = new ccui.Text('file: ' + data[0], 'Arial', 26)
      text.setPosition(cc.p(itemsize.width / 2, itemsize.height / 2))
      text.setContentSize(itemsize)
      text.setColor(data[1] ? cc.color(0, 255, 0, 255) : cc.color(255, 0, 0, 255))
      item.addChild(text)
      list.pushBackCustomItem(item)
    }
    list.jumpToTop()
    screen.addChild(list)

    let exitNode = new ccui.Text('X', 'Arial', 80)
    exitNode.setPosition(cc.p(screensize.width - 50, screensize.height - 50))
    exitNode.setTouchEnabled(true)
    exitNode.addTouchEventListener(function (btn, et) {
      if (et === ccui.Widget.TOUCH_ENDED) {
        screen.removeFromParent()
      }
    }, exitNode)
    screen.addChild(exitNode)

    cc.director.getRunningScene().addChild(screen, 100)

    let exitfunc = screen.onExit
    let exitobj = screen
    let myExit = JSPP.ppfunction(function () {
      this.screenNode = null
      this.JSPPviewNode = null
      if (exitfunc) exitfunc.apply(exitobj, arguments)
    }, this)

    screen.onExit = function () {
      myExit()
    }

    this.screenNode = screen
  }

  JSPPView.private.hideReloadJSPP = function () {
    if (this.screenNode) {
      this.screenNode.removeFromParent()
    }
  }

})()