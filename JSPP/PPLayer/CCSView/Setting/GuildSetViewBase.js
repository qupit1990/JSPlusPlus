//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  '../../CCSViewBase.js'
],function (__filepath__) {"use strict"

  //虚接口类 GuildSetViewBase
  let __public__ = {
    virtual: {
      _GuildSetViewBase:function(){ },
      // 界面显示时触发
      ShowView: 0,
      // 界面隐藏时触发
      HideView: 0,
      // 激活指定标签 (viewFrameKey,param) => void
      TitleSelected: function (viewFrameKey, param) {},
      // 设置父级view节点
      SetBackgroundView: function (view) {
        this.BackgroundView = view
      }
    }
  }
  let __protected__ = {
    BackgroundView: null
  }
  let __private__ = {}

  JSPP.ppclass('GuildSetViewBase', 'CCSViewBase', __public__, __protected__, __private__)

})
