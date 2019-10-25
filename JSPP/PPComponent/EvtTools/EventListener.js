/*
使用样例 by qupit 2019/7/31

let evtlistener = EvtTools.newEventListener("GuildRecordEvent")

let evtDispacther = EvtTools.newEventDispacther()

let ViewCB = function(evtdate){
  //Do something
}

注册监听（evtlistener可不传） ViewCB用到this需要先band
evtDispacther.registHandler(ViewCB, evtlistener)
移除监听（evtlistener可不传）
evtDispacther.unregistHandler(ViewCB, evtlistener)
通过listener移除监听
evtDispacther.removeListener(evtlistener)

发送事件
evtDispacther.postEvent(evtdate)

延时发送事件
evtDispacther.postEventNextFrame(evtdate)

*/
(function () {
  if (!window.JSPP) return

  let public = {
    static: {
      DefaultName: 'DEFULT_LISTENER'
    },
    virtual: {
      _EventListener: function () {
        this.unregistAllEventHandler()
      }
    },
    EventListener: function (name) {
      this.evtSet = new Set()

      if (name) {
        if (this.listenerNames === null) {this.listenerNames = new Set()}

        if (this.listenerNames.has(name)) {
          cc.error('Listener\'s Name Crashed !! name ==' + name)
        } else {
          this.name = name
        }
      }
    },
    unregistAllEventHandler: function () {
      this.evtSet.forEach((value) => {
        value.removeListener(this)
      })
      this.evtSet.clear()
    },
    getListenerName: function () {
      if (this.name) {
        return this.name
      } else {
        return this.DefaultName
      }
    },
    registDispacther: function (dispacther) {
      this.evtSet.add(dispacther)
    },
    unregistDispacther: function (dispacther) {
      this.evtSet.delete(dispacther)
    }
  }

  let protected = {}

  let private = {
    static: {
      listenerNames: null
    },
    name: '',
    evtSet: null
  }

  JSPP.ppclass('EventListener', public, protected, private)
})()
