(function () {

    if (!window.JSPP) return

    let __FILE_PATH__ = JSPP.__core__.DebugInfo.FilePath

    JSPP.ppinclude(
      ':/PPLayer/CCSViewBase.js',
      ':/PPComponent/CacheHeadNode.js',
      ':/PPComponent/NodeCache.js',
      ':/PPComponent/ScrollViewEx.js'
    )

    let GuildResourceConfig = include('Guild/Config/GuildResourceConfig')
    let GuildDataManager = include('Guild/Data/GuildDataManager')
    let GuildServerApi = include('Guild/ServerApi/GuildServerApi')
    let GuildUtil = include('Guild/Utils/GuildUtil')
    let GuildConfig = include('Guild/Config/GuildConfig')

    let public = {
      virtual: {
        _GuildInvitePlayers: function () {
        }
      },
      GuildInvitePlayers: function (ccpath, cfg) {

        this.doBindingWithcfgKey('exit')
        this.doBindingWithcfgKey('searchBtn')
        this.doBindingWithcfgKey('inviteItem')

        let editBg = this.getNodeBycfgKey('editBg')
        let emptytext = this.getNodeBycfgKey('IDText')
        let size = editBg.getContentSize()
        let inputNode = GuildUtil.editBoxCreate(cc.size(size.width * 0.96, size.height * 0.96), '', 8, '')
        inputNode.setInputFlag(cc.EDITBOX_INPUT_FLAG_SENSITIVE)
        inputNode.setInputMode(cc.EDITBOX_INPUT_MODE_SINGLELINE)
        inputNode.setReturnType(cc.KEYBOARD_RETURNTYPE_DONE)
        inputNode.setPosition(size.width / 2, size.height / 2)
        inputNode.setFontColor(cc.color(0, 0, 0, 255))
        inputNode.setDelegate({
          editBoxEditingDidBegin: JSPP.ppfunction(function (editBox) {
          }, this),
          editBoxEditingDidEnd: JSPP.ppfunction(function (editBox) {
          }, this),
          editBoxTextChanged: JSPP.ppfunction(function (editBox, text) {
            emptytext.setVisible(Boolean(!text))
            if (!text) {
              if (this.tempList) {
                this.refreshScroll(this.tempList)
              } else {
                this.scrollViewEx.setDataList([])
              }
            }
          }, this),
          editBoxReturn: JSPP.ppfunction(function (editBox) {
          }, this)
        })
        editBg.addChild(inputNode)
        this.exitBox = inputNode

        this.doBindingWithcfgKey('inviteItem')

        let scrollview = this.getNodeBycfgKey('scrollView')
        let scrollitem = this.getNodeBycfgKey('scrollItem')
        if (scrollview && scrollitem) {
          this.scrollViewEx = JSPP.ppnew('ScrollViewEx', scrollview, scrollitem, undefined, undefined, 1)
          this.scrollViewEx.setDataList([], JSPP.ppfunction(this.updateItem, this))
          // TODO: 添加监听
        }

        let headitem = this.getNodeBycfgKey('headTemplateItem')
        this.NodeCache = JSPP.ppnew('NodeCache', headitem, JSPP.ppfunction(function (newnode, itemnode) {
          let headBg = this.getNodeBycfgKey('peopleHeadBg', newnode)
          newnode.headImg = JSPP.ppnew('CacheHeadNode', headBg)
          newnode.headImg.setClip(GuildResourceConfig.picName.guildDefaultCircleMask)
          newnode.headImg.getRootNode().setScale(0.96)

          let idtext = this.getNodeBycfgKey('peopleId', newnode)
          idtext.ignoreContentAdaptWithSize(true)
        }, this))
        this.NodeCache.reSizeCache(4)
      },
      setTableId: function (tableId, guildId) {
        this.tableId = Number(tableId)
        this.guildId = Number(guildId)
        GuildServerApi.getGuildUserList(this.guildId, 2, null, 0, GuildUtil.GuildMaxPlayerNum(), null, JSPP.ppfunction(function (rtn) {
          if (rtn.result === 0) {
            this.onListChange(rtn.info)
          }
        }, this))
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
              cc.log('view close rigst !!!!!!!!!')
              node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
                if (type === ccui.Widget.TOUCH_ENDED) {
                  this.close()
                }
              }, this))
              break
            case 'Invate':
              node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
                if (type === ccui.Widget.TOUCH_ENDED) {
                  if (this.tmpInviteList.length <= 0){
                    utils.showMsg('请点击选择想要邀请的玩家！')
                    return
                  }
                  btn.setEnabled(false)
                  this.sendInvate()
                }
              }, this))
              break
            case 'search':
              node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
                if (type === ccui.Widget.TOUCH_ENDED) {
                  this.searchPeople()
                }
              }, this))
              break
            default:
              JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
              break
          }

        },

        updateItem: function (index, item, data) {
          item.removeAllChildren()

          let posX = 2 // 间隔2
          for (let i = 0; i < data.length; i++) {
            let headNode = this.NodeCache.addnode(item)
            headNode.setPosition(cc.p(posX, 0))
            this.updateOneNode(headNode, data[i])
            posX += headNode.getContentSize().width
          }
        },

        updateOneNode: function (node, data) {
          node.headImg.setHeadInfo(data.uid, data.headimgurl)

          let peopleName = this.getNodeBycfgKey('peopleName', node)
          let nickName = unescape(data.nickname)
          if (nickName && nickName.length > 7) {
            nickName = nickName.substring(0, 7) + '...'
          }
          peopleName.setString(nickName)

          let idtext = this.getNodeBycfgKey('peopleId', node)
          idtext.setString('ID:' + data.uid)

          let markPic = this.getNodeBycfgKey('guildMasterMark', node)
          if (GuildDataManager.isGuildOwnerByInfo(GuildDataManager.getGuildInfoByID(this.guildId), data.uid)) {
            markPic.setVisible(true)
            markPic.loadTexture(GuildResourceConfig.picName.memberRolePic[0], ccui.Widget.PLIST_TEXTURE)
          } else if (data.manager) {
            markPic.setVisible(true)
            markPic.loadTexture(GuildResourceConfig.picName.memberRolePic[1], ccui.Widget.PLIST_TEXTURE)
          } else {
            markPic.setVisible(false)
          }

          let invateSign = this.getNodeBycfgKey('peopleSelect', node)
          invateSign.setVisible(this.tmpInviteList.indexOf(data.uid) !== -1)

          let touchRange = this.getNodeBycfgKey('itemTouch', node)
          touchRange.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
            if (type === ccui.Widget.TOUCH_ENDED) {
              if (invateSign.isVisible()) {
                invateSign.setVisible(false)
                this.tmpInviteList.splice(this.tmpInviteList.indexOf(data.uid), 1)
              } else {
                invateSign.setVisible(true)
                this.tmpInviteList.push(data.uid)
              }
            }
          }, this))
        },

        searchPeople: function () {
          let keystr = this.exitBox.string
          let searchtmpList = []
          for (let index = 0; index < this.tempList.length; index++) {
            let check = this.tempList[index]
            if ((new RegExp(keystr, 'g')).test(check.uid)) {
              searchtmpList.push(check)
            } else if ((new RegExp(keystr, 'g')).test(check.nickname)) {
              searchtmpList.push(check)
            }
          }
          this.refreshScroll(searchtmpList)
        }
      }
    }

    let private = {

      NodeCache: null,
      exitBox: null,
      scrollViewEx: null,
      tableId: null,
      tmpInviteList: [],
      tempList: null,

      onListChange: function (list) {
        let tempData = list.concat()
        for (let i = 0; i < list.length; i++) {
          let aMember = list[i]
          if (aMember.online !== GuildConfig.OnLineStatus.OnlineFree) { // 去除离线
            tempData.splice(tempData.indexOf(aMember), 1)
          }
        }

        // 排序
        /*
            第一优先级，群主>管理员>普通成员；
            第二优先级，空闲>房间中>离线；
            第三优先级，ID值小的>ID值大的
            */
        let guildInfo = GuildDataManager.getGuildInfoByID(this.guildId)
        tempData.sort(function (memberA, memberB) {
          let levelA = 2
          let levelB = 2
          let uidA = memberA.uid
          let uidB = memberB.uid
          if (uidA === guildInfo.account) {
            levelA = 0
          }
          if (uidB === guildInfo.account) {
            levelB = 0
          }
          if (memberA.manager) {
            levelA = 1
          }
          if (memberB.manager) {
            levelB = 1
          }
          if (levelA !== levelB) {
            return levelA - levelB
          }

          return parseInt(uidA) - parseInt(uidB)
        })

        this.tempList = tempData
        this.refreshScroll(tempData)
      },

      refreshScroll: function (tempData) {
        let onlinelist = [[]]
        for (let i = 0; i < tempData.length; i++) {
          if (tempData[i].uid !== GuildDataManager.getSelfUid()) {
            if (onlinelist[onlinelist.length - 1].length >= 8) { //每行8个
              onlinelist.push([])
            }
            onlinelist[onlinelist.length - 1].push(tempData[i])
          }
        }

        this.scrollViewEx.setDataList(onlinelist)
      },

      sendInvate: function () {
        GuildServerApi.SendGuildInvite(this.guildId, this.tableId, this.tmpInviteList, JSPP.ppfunction(function () {
          this.close()
          utils.showMsg('邀请成功！')
        }, this))

      }
    }

    JSPP.ppclass('GuildInvitePlayers', 'CCSViewBase', public, protected, private)
  }
)()