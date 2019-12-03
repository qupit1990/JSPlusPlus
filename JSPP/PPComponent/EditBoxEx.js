/**
 * 牌友群专用 _editBox
 *
 * 使用样例：
 * 传入父底板节点 绑定生命周期
 * let editBoxEx = JSPP.ppnew('EditBoxEx', bgnode , bgimg)
 *
 * 设置最大字符长度 -1为无限制
 * exitBoxEX.setMaxLength(8)
 *
 * 设置空白提示文本
 * exitBoxEX.setEmptyWord('请输入关键字')
 *
 * 监听输入事件 事件类型为 Evt_EditBox_EditingDidBegin 等 监听函数 （evttype, string）
 * exitBoxEX.getEditBoxEventDispatcher().registHandler(JSPP.ppfunction(this.OnEditBoxEvent, this), this.listener)
 *
 */

JSPP.ppinclude([
  ':/PPComponent/EvtTools/EventDispacther.js'
], function (__filepath__) {"use strict"

  let __public__ = {
    staticconst: {
      Evt_EditBox_EditingDidBegin: 0,
      Evt_EditBox_EditingDidEnd: 1,
      Evt_EditBox_TextChanged: 2,
      Evt_EditBox_Return: 3
    },
    EditBoxEx: function (_bgNode, bgPic) {
      if (_bgNode instanceof cc.Node) {
        //let scroll = scrollViewNode
        this._bgNode = _bgNode

        let exitfunc = this._bgNode.onExit
        let exitobj = this._bgNode
        this._bgNode.onExit = JSPP.ppfunction(function () {
          this.pprelease()
          exitfunc.apply(exitobj, arguments)
        }, this)
      }

      let size = this._bgNode.getContentSize()
      let boxsize = cc.size(size.width * 0.9, size.height * 0.8)
      let inputNode = new cc.EditBox(boxsize, new cc.Scale9Sprite(bgPic))

      inputNode.setInputFlag(cc.EDITBOX_INPUT_FLAG_SENSITIVE)
      inputNode.setInputMode(cc.EDITBOX_INPUT_MODE_SINGLELINE)
      inputNode.setReturnType(cc.KEYBOARD_RETURNTYPE_DONE)
      inputNode.setPosition(size.width / 2, size.height / 2)
      inputNode.setFontColor(cc.color(0, 0, 0))
      inputNode.setDelegate({
        editBoxEditingDidBegin: JSPP.ppfunction(this.editBoxEditingDidBegin, this),
        editBoxEditingDidEnd: JSPP.ppfunction(this.editBoxEditingDidEnd, this),
        editBoxTextChanged: JSPP.ppfunction(this.editBoxTextChanged, this),
        editBoxReturn: JSPP.ppfunction(this.editBoxReturn, this)
      })
      this._bgNode.addChild(inputNode)
      this._editBox = inputNode

      this._placeWord = '请输入内容'
      let text = new ccui.Text(this._placeWord, 'Arial', Math.floor(boxsize.height / 2) )
      text.setPosition((size.width - boxsize.width)/2, size.height / 2)
      text.setAnchorPoint(cc.p(0, 0.5))
      text.setColor(cc.color(0xb2, 0xb2, 0xb2))
      this._bgNode.addChild(text, 100)
      this._placeHolder = text

      this._eventDispatcher = JSPP.ppnew('EventDispacther')
    },
    _EditBoxEx: function () {
      if (this._eventDispatcher) {
        this._eventDispatcher.pprelease()
        this._eventDispatcher = null
      }
    },
    //设置常驻提示文字
    setEmptyWord: function (emptyWord) {
      this._placeWord = emptyWord
      this._placeHolder.setString(this._placeWord)
    },
    //设置最大输入字符长度 >=0有效 -1为不限制
    setMaxLength: function (maxLength) {
      if (maxLength > -1) {
        this._editBox.setMaxLength(maxLength)
      } else {
        this._editBox.setMaxLength(-1)
      }
    },
    setFontColor: function (color) {
      this._editBox.setFontColor(color)
      this._placeHolder.setColor(color)
    },
    // 设置输入模式 cc.EDITBOX_INPUT_MODE_?
    setInputFlag: function (ccFlag) {
      this._editBox.setInputFlag(ccFlag)
    },
    // 设置输入模式 cc.EDITBOX_INPUT_MODE_?
    setInputMode: function (ccMode) {
      this._editBox.setInputMode(ccMode)
    },
    // 设置字号
    setFontSize: function (size) {
      this._editBox.setFontSize(size)
      this._placeHolder.setFontSize(size)

    },
    // 设置当前输入的文本
    setString: function(str){
      this._editBox.string = str
      this._placeHolder.setVisible(Boolean(!str))
    },
    // 获得当前输入的文本
    getString: function () {
      return this._editBox.string
    },
    // 获得输入事件发射器
    getEditBoxEventDispatcher: function () {
      return this._eventDispatcher
    }
  }

  let __protected__ = {
    _bgNode: null,
    _editBox: null,
    _placeHolder: null,

    virtual: {
      editBoxEditingDidBegin: function (_editBox) {
        this._placeHolder.setVisible(false)
        this._editBox.setPlaceHolder('')
        this._eventDispatcher.postEvent(this.Evt_EditBox_EditingDidBegin, this._editBox.string)
      },
      editBoxEditingDidEnd: function (_editBox) {
        this._placeHolder.setVisible(Boolean(!this._editBox.string))
        this._eventDispatcher.postEvent(this.Evt_EditBox_EditingDidEnd, this._editBox.string)
      },
      editBoxTextChanged: function (_editBox, text) {
        this._placeHolder.setVisible(false)
        this._editBox.setPlaceHolder('')
        this._eventDispatcher.postEvent(this.Evt_EditBox_TextChanged, text)
      },
      editBoxReturn: function (_editBox) {
        this._placeHolder.setVisible(Boolean(!this._editBox.string))
        this._eventDispatcher.postEvent(this.Evt_EditBox_Return, this._editBox.string)
      }
    }
  }

  let __private__ = {
    _placeWord: null,
    _eventDispatcher: null
  }

  JSPP.ppclass('EditBoxEx', __public__, __protected__, __private__)

})