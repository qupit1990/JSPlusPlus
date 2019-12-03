/**
 * 可复用子节点的scrollView
 *
 * 使用样例：
 * 依次传入 cc.Node  可复用的ccui.Widget  node初始化方法（没有可以传undefined）
 * let NodeCache = JSPP.ppnew('NodeCache', itemnode, function (newnode, itemnode) {
 *    每一个item的初始化准备工作,使用itemnode以处理cocos clone 引发的系列bug
 * })
 *
 * 扩展池空间值（多用于初始化创建时优化性能）
 * NodeCache.reSizeCache(10)
 *
 * 通过对象池向 fathernode 上添加新的node
 * NodeCache.addnode(fathernode)
 *
 */
JSPP.ppinclude(function (__filepath__) {"use strict"

  let __public__ = {
    // 通过node创建（可复用子节点元件,子节点元件初始化方法）
    NodeCache: function (nodeone, initFunction) {

      if (nodeone instanceof ccui.Widget) {
        let exitfunc = nodeone.onExit
        let exitobj = nodeone
        nodeone.onExit = JSPP.ppfunction(function () {
          this.pprelease()
          exitfunc.apply(exitobj, arguments)
        }, this)
      } else {
        JSPP.pperror('template node not Found')
        return
      }

      this.templateNode = nodeone
      this.templateNode.setVisible(false)

      this.dataInitFunction = initFunction
    },
    _NodeCache: function () {
      for (let index in this.newNodeList) {
        let node = this.newNodeList[index]
        node.release()
      }
      this.newNodeList.length = 0

      for (let index in this.usingNodeList) {
        let node = this.usingNodeList[index]
        node.release()
      }
      this.usingNodeList.length = 0
    },
    // 扩展池空间值（多用于初始化创建时优化性能）
    reSizeCache: function (sizeValue) {

      for (let index = 0; index < this.usingNodeList.length;) {
        let item = this.usingNodeList[index]
        if (item.getParent() !== item.cachefather) {
          this.newNodeList.push(item)
          this.usingNodeList.splice(index, 1)
        } else {
          index++
        }
      }

      while (this.newNodeList.length < sizeValue) {
        let node = this.templateNode.clone()
        if (this.dataInitFunction) this.dataInitFunction(node, this.templateNode)
        node.setVisible(false)
        node.retain()
        this.newNodeList.push(node)
      }
    },
    // 增加节点
    addnode: function (fathernode) {
      if (this.newNodeList.length <= 0) {
        this.reSizeCache(10)
      }

      let node = this.newNodeList.pop()
      this.usingNodeList.push(node)
      node.removeFromParent(false)
      fathernode.addChild(node)
      node.cachefather = fathernode
      node.setVisible(true)
      return node
    }
  }

  let __protected__ = {
    templateNode: null,
    newNodeList: [],
    usingNodeList: [],
    dataInitFunction: null
  }

  let __private__ = {
    static: {}
  }

  JSPP.ppclass('NodeCache', __public__, __protected__, __private__)

})