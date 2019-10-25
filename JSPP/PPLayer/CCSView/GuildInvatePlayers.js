(function () {

  if (!window.JSPP) return

  let __FILE_PATH__ = JSPP.__core__.DebugInfo.FilePath

  JSPP.ppinclude(
    '../CCSViewBase.js',
    ':/PPComponent/ScrollViewEx.js'
  )

  let public = {
    GuildInvatePlayers: function (ccpath, cfg) {

      this.doBindingWithcfgKey('exit')

      let emptyText = this.getNodeBycfgKey('emptyText')
      emptyText.setVisible(true)

      let scrollview = this.getNodeBycfgKey('scrollView')
      let scrollitem = this.getNodeBycfgKey('scrollItem')
      if (scrollview && scrollitem) {
        this.scrollViewEx = JSPP.ppnew('ScrollViewEx', scrollview, scrollitem, undefined, undefined, 1)
        this.scrollViewEx.setDataList([], JSPP.ppfunction(this.updateItem, this))
        // TODO: 添加监听
      }

      if (guildRef.dataManager.getLoginData().sData) {
        this.tableInfo = guildRef.dataManager.getLoginData().sData
        guild.gamenet.request('pkplayer.handler.GetGuildOnlineList', { guildid: this.tableInfo.tData.guildid }, JSPP.ppfunction(function (rtn) {
          if (rtn.result === 0) {
            this.onListChange(rtn.data)
          } else {
            let errormap = guild.dependenceInterface.getErrorCode()
            switch (rtn.result) {
              case errormap.Fail:
                guild.dependenceInterface.showMsg('服务器异常')
                break
              case errormap.playerNotFound:
                guild.dependenceInterface.showMsg('登录状态异常')
                break
              case errormap.paraError:
                guild.dependenceInterface.showMsg('参数错误')
                break
              case errormap.GuildNoAuth:
                guild.dependenceInterface.showMsg('没有权限解散该桌子')
                break
            }
          }
        }, this))
      } else {
        this.close()
      }
    }
  }

  let protected = {
    virtual: {
      onSizeChange: function () {
        this.doLayoutSimple(this.getNodeBycfgKey('block'), true)
        this.doLayoutSimple(this.getNodeBycfgKey('background'))
      },

      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'closeView':
            node.addTouchEventListener(JSPP.ppfunction(this.closeView, this))
            break
          case 'itemInvate':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                btn.setEnabled(false)
                this.sendInvate(data)
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }

      },

      closeView: function (btn, type) {
        if (type === ccui.Widget.TOUCH_ENDED) {
          this.close()
        }
      },

      updateItem: function (index, item, data) {
        let indextext = this.getNodeBycfgKey('indextext', item)
        indextext.setString('' + (index + 1))

        let peopleName = this.getNodeBycfgKey('peopleName', item)
        let nickName = unescape(data.nickname)
        if (nickName && nickName.length > 7) {
          nickName = nickName.substring(0, 7) + '...'
        }
        peopleName.setString(nickName)

        let invatebtn = this.doBindingWithcfgKey('itemInvate', item, data)
        invatebtn.setEnabled(!data.invated)
      }
    }
  }

  let private = {

    scrollViewEx: null,
    tableInfo: null,

    onListChange: function (list) {
      let onlinelist = []

      for (let i = 0; i < list.length; i++) {
        if (list[i].online === 1) {
          onlinelist.push(list[i])
        }
      }

      let emptyText = this.getNodeBycfgKey('emptyText')
      emptyText.setVisible(onlinelist.length <= 0)

      this.scrollViewEx.setDataList(onlinelist)
    },

    sendInvate: function (data) {
      let param = {
        guildid: this.tableInfo.tData.guildid,
        tableid: Number(this.tableInfo.tData.tableid),
        uids: [data.uid]
      }

      guild.gamenet.request('pkplayer.handler.SendGuildInvite', param, JSPP.ppfunction(function (rtn) {
        if (rtn.result !== 0) {
          let errormap = guild.dependenceInterface.getErrorCode()
          switch (rtn.result) {
            case errormap.Fail:
              guild.dependenceInterface.showMsg('服务器异常')
              break
            case errormap.playerNotFound:
              guild.dependenceInterface.showMsg('登录状态异常')
              break
            case errormap.paraError:
              guild.dependenceInterface.showMsg('参数错误')
              break
            case errormap.GuildNoAuth:
              guild.dependenceInterface.showMsg('没有权限解散该桌子')
              break
          }
        }
      }, this))
    }
  }

  JSPP.ppclass('GuildInvatePlayers', 'CCSViewBase', public, protected, private)
})()