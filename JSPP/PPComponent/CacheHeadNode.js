/*
*  // 需要环境 cc.sys.isNative === true // TODO: 非native 环境下 功能有待完善
*  // 使用样例
*  let headBg = playerNode.getChildByName('head_bg')
*  // 创建时需要传入底板图片节点
*  playerNode.HeadCachedCtrl = JSPP.ppnew('CacheHeadNode', headBg)
*  // 设置clip模式 支持多次重置
*  playerNode.HeadCachedCtrl.setClip(GuildResourceConfig.picName.guildDefaultCircleMask)
*  // 移除clip模式
*  playerNode.HeadCachedCtrl.removeClip()
*  // 设置头像 支持多次重置
*  playerNode.HeadCachedCtrl.setHeadInfo(info.uid, url)
*  // 使用cocos Node功能可以通过这个接口获取
*  playerNode.HeadCachedCtrl.getRootNode().setScale(0.96)
*
*/

(function () {
  if (!window.JSPP) return

  JSPP.ppinclude(
    ':/PPFrameWork/MD5.js',
    ':/PPFrameWork/Base64.js'
  )

  let DefaultHead = include('Game/ResourceConfig').DEFALUTHEAD

  let public = {
    static: {
      clearCache: function () {
        if (this.HeadSavePath) {
          jsb.fileUtils.isDirectoryExist(this.HeadSavePath, JSPP.ppfunction(function (bExist) {
            if (bExist) {
              jsb.fileUtils.removeDirectory(this.HeadSavePath, JSPP.ppfunction(function () {
                jsb.fileUtils.createDirectory(this.HeadSavePath, function () {})
              }, this))
            } else {
              jsb.fileUtils.createDirectory(this.HeadSavePath, function () {})
            }
          }, this))
        }
        this.headFileCache = {}
        utils.localStorage.setDataForKey('PPCacheHeadFile', this.headFileCache)
        this.headTextureCache = {}
      }
    },
    // 通过头像底框创建（backNode）
    CacheHeadNode: function (backNode) {
      if (backNode instanceof cc.Node) {
        let exitfunc = backNode.onExit
        let exitobj = backNode
        backNode.onExit = JSPP.ppfunction(function () {
          this.pprelease()
          exitfunc.apply(exitobj, arguments)
        }, this)
      } else {
        JSPP.pperror('template node not Found')
        return
      }

      this.parentNode = backNode

      this.rootNode = new cc.Node()
      let targetSize = this.parentNode.getContentSize()
      this.rootNode.setPosition(cc.p(targetSize.width / 2, targetSize.height / 2))
      this.parentNode.addChild(this.rootNode)
    },
    _CacheHeadNode: function () {
    },
    // 设置头像显示信息
    setHeadInfo: function (uid, url) {
      this.showingUid = uid
      if (this.showingUrl === url) {
        return
      }
      // cc.log('get real Head = > ' + uid + ' url = > ' + url)

      if (!url || url.length <= 4 || url.substring(0, 4) !== 'http') {
        // 非正常的Url 直接使用默认头像
        if (this.showingUrl === DefaultHead) {
          return
        }
        this.showingUrl = DefaultHead
        this.setTextureWithDefault(uid, DefaultHead)
        return
      }

      this.showingUrl = url
      let texture = this.getHeadTextureByCache(uid, url)
      if (texture) { // 已经加载了的文件
        this.setTexture(texture)
        return
      }

      if (!this.HeadSavePath) {
        //由于创建路径接口移动到异步 如果路径尚未创建成功 先用默认图片显示
        this.setTextureWithDefault(uid, DefaultHead)
        return
      }

      // 先清理掉旧的 等待新的
      if (this.imgSpr) {
        this.imgSpr.removeFromParent()
        this.imgSpr = null
      }

      let FilePath = this.getHeadFilePathByCache(uid, url)
      if (FilePath) { // 已下载过的文件
        this.setTextureByFilePath(FilePath, uid, url)
        return
      }

      // 需要下载的文件
      this.downLoadHeadImg(uid, url)
    },
    // 设置头像遮罩
    setClip: function (clip) {
      if (this.usingClip === clip) return
      let cliptex = null
      if (typeof clip === 'string') {
        cliptex = appInstance.resManager().getSpriteFrame(clip)
        if (this.usingClip === cliptex) return
      }

      if (!cliptex) {
        cliptex = clip
      }

      let steil = new cc.Sprite(cliptex)
      if (!steil) return

      this.usingClip = clip

      if (!this.clipNode) {
        this.clipNode = new cc.ClippingNode()
        this.clipNode.setInverted(false)
        this.clipNode.setAlphaThreshold(0) // 设置绘制底板的Alpha值为0
        if (this.imgSpr) {
          // 转移图标
          this.imgSpr.removeFromParent(false)
          this.clipNode.addChild(this.imgSpr)
        }
        this.rootNode.addChild(this.clipNode)
      }

      this.clipNode.setStencil(steil)
    },
    // 移除头像遮罩
    removeClip: function () {
      if (!this.clipNode) return

      if (this.imgSpr) {
        // 转移图标
        this.imgSpr.removeFromParent(false)
        this.rootNode.addChild(this.imgSpr)
      }
      this.clipNode.removeFromParent()
      this.clipNode = null
      this.usingClip = null
    },
    /**
     * 使用shader 变灰 或者恢复正常
     * @param isGray
     */
    setGray: function (isGray) {
      let glProgramState = null
      if (isGray) {
        glProgramState = cc.GLProgramState.getOrCreateWithGLProgramName('ShaderUIGrayScale')
      } else {
        glProgramState = cc.GLProgramState.getOrCreateWithGLProgramName('ShaderPositionTextureColor_noMVP')
      }
      this.rootNode.setGLProgramStateEX(glProgramState, true)
    },
    // 如果需要调整scale等原生属性可以使用此接口
    getRootNode: function () {
      return this.rootNode
    }
  }

  let protected = {
    parentNode: null,
    rootNode: null,
    clipNode: null,
    imgSpr: null,
    downLoadHeadImg: function (uid, url) {
      if (!cc.sys.isNative) return
      this.headFileCache[uid] = null
      this.downloadImg(uid, url)
    },
    writeBytesIntoFile: function (bytes, path, id) {
      let fileSaved = false
      try {
        fileSaved = jsb.fileUtils.writeDataToFile(bytes, path)
      } catch (e) {
        cc.error('Save %s head is faild! [%s]', id, e)
      }
      return fileSaved
    },
    setTextureByFilePath: function (FilePath, uid, url) {
      let ImgUid = uid
      let ImgUrl = url
      cc.loader.loadImg(FilePath, JSPP.ppfunction(function (option, tex) {
        if (!tex) {
          cc.error('CacheHeadNode path ' + FilePath + ' load faild  reDownLoad !')
          this.downLoadHeadImg(ImgUid, ImgUrl)
          return
        }
        this.headTextureCache[ImgUid] = [ImgUrl, tex]
        if (ImgUrl === this.showingUrl) {
          try {
            this.setTexture(tex)
          } catch (e) {
            cc.error('CacheHeadNode _loadHeadTexture error ' + e)
          }
        }
      }, this))
    },
    setTextureWithBadImg: function (uid, url) {
      let BadImgID = uid
      let BadImgUrl = url
      let tex = this.getHeadTextureByCache(this.IDWxBadImg, this.IDWxBadImg)
      if (tex) {
        this.headTextureCache[BadImgID] = [BadImgUrl, tex]
        if (this.showingUid === uid) {
          this.setTexture(tex)
        }
      } else {
        let savePath = this.HeadSavePath + 'Head_' + this.IDWxBadImg
        cc.loader.loadImg(savePath, JSPP.ppfunction(function (option, tex) {
          if (!tex) {
            cc.error('CacheHeadNode BadWXImg load faild  reDownLoad !')
            this.headFileCache[this.IDWxBadImg] = undefined
            utils.localStorage.setDataForKey('PPCacheHeadFile', this.headFileCache)
            this.downLoadHeadImg(BadImgID, BadImgUrl)
            return
          }
          this.headTextureCache[this.IDWxBadImg] = [this.IDWxBadImg, tex]
          this.headTextureCache[BadImgID] = [BadImgUrl, tex]
          if (this.showingUid === BadImgID) {
            this.setTexture(tex)
          }
        }, this))
      }
    },
    setTextureWithDefault: function (uid, url) {
      if (this.defaultTexture) {
        if (this.showingUid === uid) {
          this.setTexture(this.defaultTexture)
        }
      } else {
        let defaultID = uid
        let defaultUrl = url
        cc.loader.loadImg(DefaultHead, JSPP.ppfunction(function (option, tex) {
          if (tex) {
            this.defaultTexture = tex
            //this.headTextureCache[defaultID] = [defaultUrl, tex]
            if (this.showingUid === defaultID) {
              this.setTexture(tex)
            }
          }
        }, this))
      }
    },
    setTexture: function (texture) {
      let newSpr = new cc.Sprite(texture)
      if (!newSpr) return
      newSpr.setScale((this.parentNode.getContentSize().width / newSpr.getContentSize().width))
      if (this.clipNode) {
        this.clipNode.addChild(newSpr)
      } else {
        this.rootNode.addChild(newSpr)
      }

      if (this.imgSpr) {
        this.imgSpr.removeFromParent()
      }
      this.imgSpr = newSpr
    }
  }

  let private = {
    static: {
      static: function () {
        this.headFileCache = utils.localStorage.getDataForKey('PPCacheHeadFile') || {}
        let TargetPath = jsb.fileUtils.getWritablePath() + 'headCache/'
        jsb.fileUtils.isDirectoryExist(TargetPath, JSPP.ppfunction(function (bExist) {
          if (bExist) {
            this.HeadSavePath = TargetPath
            return
          }

          jsb.fileUtils.createDirectory(TargetPath, JSPP.ppfunction(function () {
            this.HeadSavePath = TargetPath
          }, this))
        }, this))
      },
      // 当有值时。路径已经成功创建
      HeadSavePath: null,
      IDWxBadImg: 'WXBadImg',
      // 微信头像授权过期时，返回头像的相关信息
      IDWxBadHeadInfo: { size: 5093, md5: '0a1bc4d401022df14cea2dd1bb4e5754' },
      headTextureCache: {},
      headFileCache: null,
      defaultTexture: null,
      getHeadTextureByCache: function (uid, url) {
        if (this.headTextureCache[uid] && this.headTextureCache[uid][0] === url) {
          return this.headTextureCache[uid][1]
        }
        return null
      },
      getHeadFilePathByCache: function (uid, url) {
        if (this.headFileCache[uid] && this.headFileCache[uid] === url) {
          return this.HeadSavePath + 'Head_' + uid
        }
        return null
      }
    },
    usingClip: null,
    showingUid: null,
    showingUrl: null,
    downloadImg: function (uid, url) {
      let downloadIngUid = uid
      let downLoadURl = url
      let xhr = cc.loader.getXMLHttpRequest()
      xhr.onreadystatechange = JSPP.ppfunction(function () { // 下载文件
        if (xhr.readyState === 4 && xhr.status === 200) {
          xhr.responseType = 'arraybuffer'
          let bytes = new Uint8Array(xhr.response)
          this.downloadSuccess(bytes, downloadIngUid, downLoadURl)
        } else {
          this.downloadFaild(downloadIngUid, downLoadURl)
        }
      }, this)
      xhr.onerror = JSPP.ppfunction(function () {
        this.downloadFaild(downloadIngUid, downLoadURl)
      }, this)
      xhr.open('GET', url, true)
      xhr.send()
    },
    downloadSuccess: function (bytes, downloadIngUid, downLoadURl) {
      // 这里是微信授权失效情况下的返回头像。
      if (bytes.length === this.IDWxBadHeadInfo.size && JSPP.ppstatic('MD5').MD5FromString(JSPP.ppstatic('Base64').encode(this.bytesToString(bytes))) === this.IDWxBadHeadInfo.md5) {
        // 下次游戏重新请求
        this.headFileCache[downloadIngUid] = undefined
        cc.log('url [' + downLoadURl + '] is [WXBadImg] not putIn Cache ')

        // 第一个坏头像 写入到 IDWxBadImg 位置）。
        let savePath = this.HeadSavePath + 'Head_' + this.IDWxBadImg
        if (!this.headFileCache[this.IDWxBadImg]) {
          if (this.writeBytesIntoFile(bytes, savePath, this.IDWxBadImg)) {
            this.headFileCache[this.IDWxBadImg] = savePath
            utils.localStorage.setDataForKey('PPCacheHeadFile', this.headFileCache)
          } else {
            // 写入文件失败 （手机内存不足）
            if (this.showingUid === downloadIngUid) {
              this.showingUrl = DefaultHead
              this.setTextureWithDefault(downloadIngUid, downLoadURl)
            }
            return
          }
        }

        // 使用微信坏头像显示
        this.setTextureWithBadImg(downloadIngUid, downLoadURl)
      } else {
        let savePath = this.HeadSavePath + 'Head_' + downloadIngUid
        if (cc.textureCache.getTextureForKey(savePath)) {
          cc.textureCache.removeTextureForKey(savePath)
        }

        //记录文件
        if (this.writeBytesIntoFile(bytes, savePath, downloadIngUid)) {
          // 新图片下载成功
          this.headFileCache[downloadIngUid] = downLoadURl
          utils.localStorage.setDataForKey('PPCacheHeadFile', this.headFileCache)
          this.setTextureByFilePath(savePath, downloadIngUid, downLoadURl)
        } else {
          // 写入文件失败 （手机内存不足）
          this.headFileCache[downloadIngUid] = undefined
          if (this.showingUid === downloadIngUid) {
            this.showingUrl = DefaultHead
            this.setTextureWithDefault(downloadIngUid, downLoadURl)
          }
        }
      }
    },
    downloadFaild: function (downloadIngUid, downLoadURl) {
      cc.error('download headImg Error %s ! => use Default Texture', downLoadURl)
      if (this.showingUid === downloadIngUid) {
        this.showingUrl = DefaultHead
        this.setTextureWithDefault(downloadIngUid, downLoadURl)
      }
    },
    bytesToString: function (bytes) {
      let offset = 0
      let length = bytes.length

      let array = []
      let end = offset + length

      while (offset < end) {
        let code = 0

        if (bytes[offset] < 128) {
          code = bytes[offset]

          offset += 1
        } else if (bytes[offset] < 224) {
          code = ((bytes[offset] & 0x3f) << 6) + (bytes[offset + 1] & 0x3f)
          offset += 2
        } else {
          code = ((bytes[offset] & 0x0f) << 12) + ((bytes[offset + 1] & 0x3f) << 6) + (bytes[offset + 2] & 0x3f)
          offset += 3
        }

        array.push(code)

      }
      let str = ''
      for (let i = 0; i < array.length;) {
        str += String.fromCharCode.apply(null, array.slice(i, i + 10000))
        i += 10000
      }

      return str
    }
  }

  JSPP.ppclass('CacheHeadNode', public, protected, private)

})
()