//  Created by qupit in 2019/9/25.

(function () {

  JSPP.ppinclude(
    ':/PPData/Record/GuildRecordData.js',
    ':/PPComponent/CacheHeadNode.js',
    ':/PPComponent/ScrollViewEx.js',
    ':/PPComponent/NodeCache.js',
    '../GuildRecordViewBase.js'
  )

  let GuildUtil = include('Guild/Utils/GuildUtil')
  let ModulePublicInterface = include('Game/ModulePublicInterface')
  let DatePickerLayer = include('Guild/UI/Component/DatePicker')
  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let numImg = ['res/guildRes/club/histroy/histroy_bg_12.png', 'res/guildRes/club/histroy/histroy_bg_13.png']

  let public = {
    virtual: {
      _GuildRoomLayer: function () {},

      ShowView: function () {
        this.rootnode.setVisible(true)

        this.searchingId = undefined
        this.searchingTableId = undefined
        this.getNodeBycfgKey('emptyTip').setVisible(true)
        this.getNodeBycfgKey('roomInfoNode').setVisible(false)
        this.getNodeBycfgKey('playerInfoNode').setVisible(false)
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      },

      ChangeReqParam: function (param) {
        if (!this.ppsuper(param)) return false
        if (param.searchString) {
          let reg = new RegExp('^[0-9]*$')
          if (!reg.test(param.searchString)) {
            return false
          }

          if (this.getNodeBycfgKey('roomInfoNode').isVisible()) {
            this.searchingTableId = param.searchString
            this.searchingId = null
          } else {
            this.searchingId = param.searchString
            this.searchingTableId = null
          }
        } else {
          this.searchingTableId = null
          this.searchingId = null
        }
        this.starttime = param.starttime
        this.endtime = param.endtime
        this.scoreMin = param.scoreMin
        this.scoreMax = param.scoreMax
        JSPP.ppstatic('GuildRecordData').getInstance().requerstGetGuildGameTable(this.starttime, this.endtime, this.searchingId, this.searchingTableId, this.order, this.scoreMin, this.scoreMax, false)
        return true
      },
      // 激活指定标签 (viewFrameKey) => void
      TitleSelected: function (viewFrameKey, param) {
        switch (viewFrameKey) {
          case 'my_roomInfo':
            this.searchingId = param.searchString
            this.searchingTableId = undefined
            this.getNodeBycfgKey('roomInfoNode').setVisible(false)
            this.onDataChange({ info: [] })
            this.ChangeReqParam(param)
            break
          case 'guild_roomInfo':
            this.searchingId = undefined
            this.searchingTableId = param.searchString
            this.getNodeBycfgKey('roomInfoNode').setVisible(true)
            this.onDataChange({ info: [] })
            this.ChangeReqParam(param)
            break
          case 'other_roomInfo':
            this.searchingId = param.searchString
            this.searchingTableId = undefined
            this.getNodeBycfgKey('roomInfoNode').setVisible(false)
            this.onDataChange({ info: [] })
            if (param.searchString) {
              this.ChangeReqParam(param)
            }
            break
        }
      }
    },
    GuildRoomLayer: function (ccpath, cfg) {

      JSPP.ppstatic('GuildRecordData').getInstance().getDispatcher('recorddataChangeEvent').registHandler(JSPP.ppfunction(this.onDataChange, this), this.listener)

      let playeritemsize = this.getNodeBycfgKey('playeritem').getContentSize()
      this.scrollviewEx = JSPP.ppnew('ScrollViewEx', this.doBindingWithcfgKey('scrollview'), this.getNodeBycfgKey('scrollitem'), undefined, function (item, data) {
        if (!data || !data.players || data.players.length <= 4) {
          return item.getContentSize()
        } else {
          let roomInfoheight = item.getChildByName('roomInfo').getContentSize().height
          return cc.size(item.getContentSize().width, roomInfoheight + Math.floor((data.players.length + 3) / 4) * playeritemsize.height)
        }
      }, 0)

      this.peopleNodeCache = JSPP.ppnew('NodeCache', this.getNodeBycfgKey('playeritem'), function (item, template) {
        let headBg = item.getChildByName('plIcon')
        item.headnode = JSPP.ppnew('CacheHeadNode',headBg)
        item.headnode.getRootNode().setScale(0.96)

        let scoreImgText = item.getChildByName('plScore')
        scoreImgText.ignoreContentAdaptWithSize(true)
      })
      // 初始化30个对象
      this.peopleNodeCache.reSizeCache(30)

      this.checkTime = (new Date()).getTime()
      this.doBindingWithcfgKey('btnpaixu').setSelected(!this.order)
    }
  }

  let protected = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'ChangeSort':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.CheckBox.EVENT_SELECTED) {
                this.setSort(false)
              } else if (type === ccui.CheckBox.EVENT_UNSELECTED) {
                this.setSort(true)
              }
            }, this))
            break
          case 'ScrollEvent':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.ScrollView.EVENT_BOUNCE_BOTTOM) {
                this.tryReqMore()
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },
      setSort: function (bValue) {
        let ret = JSPP.ppstatic('GuildRecordData').getInstance().requerstGetGuildGameTable(this.starttime, this.endtime, this.searchingId, this.searchingTableId, bValue, this.scoreMin, this.scoreMax, false)
        if (ret) {
          this.order = bValue
        }
      },
      tryReqMore: function () {
        // 请求刷新数据
        JSPP.ppstatic('GuildRecordData').getInstance().requerstGetGuildGameTable(this.starttime, this.endtime, this.searchingId, this.searchingTableId, this.order, this.scoreMin, this.scoreMax, true)
      },
      onDataChange: function (data, more) {
        if (this.getNodeBycfgKey('roomInfoNode').isVisible()) {
          this.getNodeBycfgKey('playerInfoNode').setVisible(false)
          let guildCountText = this.getNodeBycfgKey('roomInfoNode').getChildByName('guildCount')
          guildCountText.setString(data.gamecount)
          let guildConsumeText = this.getNodeBycfgKey('roomInfoNode').getChildByName('guildConsume')
          guildConsumeText.setString(data.totalMoney)
        } else {
          if (!this.searchingId) {
            //处理this.searchingId为undefined时(网络慢，未返回情况下切换到其他页签的情况) 清空显示
            this.getNodeBycfgKey('playerInfoNode').setVisible(false)
            this.getNodeBycfgKey('emptyTip').setVisible(true)
            this.tmpArray = []
            this.scrollviewEx.setDataList(this.tmpArray, this.updateItem.bind(this))
            return
          }

          let myinfo = GuildDataManager.getSelfInfo()
          if (this.searchingId == myinfo.uid) {
            this.getNodeBycfgKey('playerInfoNode').setVisible(true)

            let headbg = this.getNodeBycfgKey('playerInfoNode').getChildByName('icon')
            if (!headbg.headnode){
              headbg.headnode = JSPP.ppnew('CacheHeadNode',headbg)
              headbg.headnode.getRootNode().setScale(0.96)
            }
            headbg.headnode.setHeadInfo(data.uid, data.headimgurl)

            let nameText = this.getNodeBycfgKey('playerInfoNode').getChildByName('name')
            let nickName = ''
            if (myinfo.name) {
              nickName = GuildUtil.getOmittedString(unescape(myinfo.name), 14, true)
            }
            nameText.setString(nickName)

          } else if (data.userStatistics && data.info && data.info.length > 0) {
            this.getNodeBycfgKey('playerInfoNode').setVisible(true)

            let headBg = this.getNodeBycfgKey('playerInfoNode').getChildByName('icon')
            if (!headBg.headnode){
              headBg.headnode = JSPP.ppnew('CacheHeadNode',headBg)
              headBg.headnode.getRootNode().setScale(0.96)
            }
            headBg.headnode.setHeadInfo(this.searchingId, data.userStatistics.headimgurl)

            let nameText = this.getNodeBycfgKey('playerInfoNode').getChildByName('name')
            let nickName = ''
            if (data.userStatistics.nickname) {
              nickName = GuildUtil.getOmittedString(unescape(data.userStatistics.nickname), 14, true)
            }
            nameText.setString(nickName)

          } else {
            this.getNodeBycfgKey('playerInfoNode').setVisible(false)
          }

          if (data.userStatistics) {
            let playTotalText = this.getNodeBycfgKey('playerInfoNode').getChildByName('play_total')
            playTotalText.setString(data.userStatistics.gameCount + '/' + data.userStatistics.totalPoint)

            let playWinText = this.getNodeBycfgKey('playerInfoNode').getChildByName('play_win')
            playWinText.setString(data.userStatistics.winnerCount + '/' + data.userStatistics.winnerTotalPoint)
          }
        }

        this.tmpArray = []
        if (data.info instanceof Array && data.info.length > 0) {
          for (let index = 0; index < data.info.length; index++) {
            this.tmpArray.push(data.info[index])
            //this.tmpArray.push(data.info[index])
            //this.tmpArray.push(data.info[index])
            //this.tmpArray.push(data.info[index])
            //this.tmpArray.push(data.info[index])
            //this.tmpArray.push(data.info[index])
            //this.tmpArray.push(data.info[index])
            //this.tmpArray.push(data.info[index])
          }
          this.getNodeBycfgKey('emptyTip').setVisible(data.info.length <= 0)
        } else {
          this.getNodeBycfgKey('emptyTip').setVisible(true)
        }
        if (more) {
          this.scrollviewEx.addDataList(this.tmpArray)
        } else {
          this.scrollviewEx.setDataList(this.tmpArray, this.updateItem.bind(this))
        }
      },
      updateItem: function (index, item, data) {
        let roomInfo = item.getChildByName('roomInfo')
        if (data.gameid && data.createPara) {
          let roomPlayType = roomInfo.getChildByName('playType')
          roomPlayType.setString('玩法: ' + ModulePublicInterface.getPlayTypeName(data.gameid, data.createPara))
        }

        let roomNumber = roomInfo.getChildByName('roomNo')
        roomNumber.setString(data.tableid)

        if (data.timeEnd) {
          let Date = utils.timeUtil.getDateFromTime(data.timeEnd)

          let dayStr = utils.timeUtil.getDateDayStr(Date, '.')
          let roomtime = roomInfo.getChildByName('timeDate')
          roomtime.setString(dayStr)

          dayStr = utils.timeUtil.getDateHourStr(Date, ':')
          let roomtimeSc = roomInfo.getChildByName('timeHour')
          roomtimeSc.setString(dayStr)
        }

        let playerpanel = item.getChildByName('playerpanel')
        playerpanel.removeAllChildren()

        let size = this.getNodeBycfgKey('playeritem').getContentSize()
        let MaxH = Math.floor((data.players.length + 3) / 4) * size.height

        playerpanel.setContentSize(cc.size(playerpanel.getContentSize().width, MaxH))
        item.setContentSize(cc.size(item.getContentSize().width, MaxH + roomInfo.getContentSize().height))
        roomInfo.setPositionY(MaxH + roomInfo.getContentSize().height)

        for (let i = 0; i < data.players.length; i++) {
          let playerData = data.players[i]
          let peoplenode = this.peopleNodeCache.addnode(playerpanel)
          peoplenode.setPosition(cc.p(size.width * (i % 4), MaxH - size.height - size.height * Math.floor(i / 4)))
          this.updatePlayer(peoplenode, playerData, data.owner)
          if (i % 4 === 3) {
            peoplenode.getChildByName('curline').setVisible(false)
          }
        }

        // 设置点击事件
        item.onClicked(function () {
          function getReplayId () {
            for (let j = 0; j < data.players.length; j++) {
              if (data.players[j].uid === GuildDataManager.getSelfUid()) {
                return data.players[j].uid
              }
            }
            return data.players[0].uid
          }

          cc.log('call roomDetal data = ' + JSON.stringify(data))
          GuildUtil.ShowGuildPlayBack(data, getReplayId())
        }, this.Proxy)
      },
      updatePlayer: function (playernode, data, ownerid) {
        if (!data) {
          playernode.setVisible(false)
          return
        }
        playernode.setVisible(true)

        playernode.headnode.setHeadInfo(data.uid, data.headimgurl)

        // 合群没有房主
        // let ownerImg = headBg.getChildByName('plOwner')
        // ownerImg.setVisible(data.uid == ownerid)
        // ownerImg.setLocalZOrder(10)

        let headBg = playernode.getChildByName('plIcon')
        let winnerImg = headBg.getChildByName('big_winner')
        winnerImg.setVisible(data.isBigWinner)
        winnerImg.setLocalZOrder(10)

        let nameText = playernode.getChildByName('plName')
        let nickName = ''
        if (data.nickname) {
          nickName = GuildUtil.getOmittedString(unescape(data.nickname), 14, true)
        }
        nameText.setString(nickName)

        let idText = playernode.getChildByName('plUid')
        idText.setString('ID:' + data.uid)

        let scoreImgText = playernode.getChildByName('plScore')
        let strScore, fileName
        if (data.score > 0) {
          strScore = '+' + data.score
          fileName = numImg[0]
        } else {
          strScore = '' + data.score
          fileName = numImg[1]
        }
        scoreImgText.setProperty(strScore, fileName, 20, 34, '+')
        playernode.getChildByName('cpsCost').setVisible(data.isBigWinner)
        playernode.getChildByName('cpsBg').setVisible(data.isBigWinner)
        if (data.isBigWinner) {
          playernode.getChildByName('cpsCost').setString('消耗:' + data.cpsCost)
        }


      }
    }
  }

  let private = {
    // 人物对象池
    peopleNodeCache: undefined,
    //滚动控件
    scrollviewEx: undefined,
    //查询人id
    searchingId: undefined,
    //查询房间id
    searchingTableId: undefined,
    //排序标记
    order: false,

    starttime : null,
    endtime : null,
    scoreMin : null,
    scoreMax : null,
    //数据缓存
    tmpArray: []
  }

  JSPP.ppclass('GuildRoomLayer', 'GuildRecordViewBase', public, protected, private)

})()

/*/

load('Guild/UI/Record/GuildRecordLayer', function () {

  JSPP.ppinclude(
    ':/PPComponent/NodeCache.js',
    ':/PPComponent/ScrollViewEx.js',
    ':/PPComponent/EvtTools/EventDispacther.js',
    ':/PPComponent/EvtTools/EventListener.js'
  )

  let GuildResourceConfig = include('Guild/Config/GuildResourceConfig')
  let BaseLayer = include('App/Base/BaseLayer')
  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')
  let PackageConfig = include('Game/PackageConfig')
  let ModulePublicInterface = include('Game/ModulePublicInterface')

  let GuildExpendLayer = include('Guild/UI/Record/GuildExpendLayer')


})

//*/