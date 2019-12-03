/**
 * 可复用子节点的scrollView
 *
 * 使用样例：
 * 依次传入 ccui.scrollview  可复用的item  item初始化方法（没有可以传undefined）  按钮间距
 * let scrollviewEx = JSPP.ppnew('ScrollViewEx', scrollview, scrollitem, function (newitem, baseitem) {
 *    每一个item的初始化准备工作,使用baseitem以处理cocos clone 引发的系列bug
 * }, function (templateItem, templateData){
 *    使用baseitem 通过给的模版数据 计算按钮大小，按钮大小没有变化时不传此方法可大量优化性能
 *    return templateItem.getContentSize()
 * }, 5)
 *
 * 设置数据排列方式，默认false 0->length
 * scrollviewEx.setDataRevert(true)
 *
 * 修改列表显示区域大小 重置全部ui 性能开销较大 建议只在初始化时使用一次即可
 * scrollviewEx.setContentSize(cc.size(w,h))
 *
 * 设置数据列表和数据使用方法
 * @param tmplist 显示用数据数组
 * @param bstatic 是否保持原位显示,（可省略）默认否
 * @param function 用于刷新按钮的方法,（可省略）默认使用上次传入的
 * scrollviewEx.setDataList(tmplist, bstatic, function (index, item, data) {
 *    每一个item如何使用data正确显示
 * })
 *
 * 数据需要增加时可以使用此方法实现向下添加（其他的同理）
 * let oldRange = this.scrollviewEx.getMaxScrollRange()
 * let oldPercent = this.scrollviewEx.getPercent()
 * this.scrollviewEx.setDataList(this.tmpArray)
 * let newRange = this.scrollviewEx.getMaxScrollRange()
 * let newPercent = (oldPercent * oldRange + newRange - oldRange) / newRange
 * this.scrollviewEx.setPercent(newPercent)
 *
 */
JSPP.ppinclude(function (__filepath__) {"use strict"

  let __public__ = {
    //通过scrollView创建（scrollView节点,可复用子节点元件,子节点元件初始化方法,[子节点尺寸计算方法,间距]）
    ScrollViewEx: function (scrollViewNode, childrenNode, initFunction, itemsizeFunc, baseSpase) {

      if (scrollViewNode instanceof ccui.ScrollView) {
        //let scroll = scrollViewNode
        this.scrollNode = scrollViewNode

        this.scrollNode.setContentSize = JSPP.ppfunction(function (size) {
          this.setContentSize(size)
        }, this)

        let exitfunc = this.scrollNode.onExit
        let exitobj = this.scrollNode
        this.scrollNode.onExit = JSPP.ppfunction(function () {
          this.pprelease()
          exitfunc.apply(exitobj, arguments)
        }, this)

      }

      this._dataInitFunction = initFunction
      this._itemSizeFunction = itemsizeFunc

      if (baseSpase)
        this._itemSpase = baseSpase

      if (childrenNode instanceof ccui.Widget) {
        childrenNode.setVisible(false)
        this.childrenNode = childrenNode

        let towards = this.scrollNode.getDirection()
        if (towards === 0) {
          this._showRange = this.scrollNode.getContentSize().width
          this._itemMinRange = this.childrenNode.getContentSize().width + this._itemSpase
        } else if (towards === 1) {
          this._showRange = this.scrollNode.getContentSize().height
          this._itemMinRange = this.childrenNode.getContentSize().height + this._itemSpase
        } else {
          return
        }
        this._towards = towards
        this._itemShowMaxNum = Math.floor((this._showRange + this._itemMinRange - 1) / this._itemMinRange)

        for (let i = 0; i < this._itemShowMaxNum + 1; i++) {
          let newnode = this.childrenNode.clone()
          if (this._dataInitFunction) this._dataInitFunction(newnode, this.childrenNode)
          this.scrollNode.addChild(newnode)
          this._childrenList.push(newnode)
          newnode.setVisible(false)
        }

        this.scrollNode.updateing = JSPP.ppfunction(this._update, this)
        this.scrollNode.schedule(this.scrollNode.updateing, 1 / 60)
      } else {
        JSPP.pperror('childrenNode not Found')
        return
      }
    },
    _ScrollViewEx: function () {
      if (this.scrollNode.updateing) {
        this.scrollNode.unschedule(this.scrollNode.updateing)
        this.scrollNode.updateing = undefined
      }
    },
    setContentSize: function (size) {
      let now = this.scrollNode.getContentSize()
      if (now.width == size.width && now.height == size.height) return

      this.scrollNode.__proto__.setContentSize.apply(this.scrollNode, arguments)

      if (!this.childrenNode) return

      if (this._towards === 0) {
        this._showRange = size.width
      } else if (this._towards === 1) {
        this._showRange = size.height
      }

      this._itemShowMaxNum = Math.floor((this._showRange + this._itemMinRange - 1) / this._itemMinRange)
      while (this._itemShowMaxNum + 1 < this._childrenList.length) {
        let item = this._childrenList.pop()
        item.removeFromParent()
      }
      for (let i = this._childrenList.length; i < this._itemShowMaxNum + 1; i++) {
        let newnode = this.childrenNode.clone()
        if (this._dataInitFunction) this._dataInitFunction(newnode, this.childrenNode)
        this.scrollNode.addChild(newnode)
        this._childrenList.push(newnode)
      }

      if (this._dataList) {
        this.setDataList(this._dataList)
      }
    },
    //设置使用的数据
    setDataList: function (dataList, keepStatic, dataFunction) {
      if (!dataList instanceof Array) return
      this._dataList = dataList
      if (!dataFunction && typeof keepStatic === 'function') {
        dataFunction = keepStatic
        keepStatic = undefined
      }
      if (dataFunction) this._dataChangeFunction = dataFunction

      this.scrollNode.stopAutoScroll()

      let oldMaxRange = this._maxRange
      for (let i = 0; i < this._childrenList.length; i++) {
        let item = this._childrenList[i]
        item._showingindex = undefined
      }

      if (this._itemSizeFunction) {
        this._maxRange = this._itemSpase * 2
        for (let i in dataList) {
          let itemsize = this._itemSizeFunction(this.childrenNode, dataList[i])
          if (this._towards == 0) {
            this._maxRange += itemsize.width + this._itemSpase
          } else if (this._towards == 1) {
            this._maxRange += itemsize.height + this._itemSpase
          }
        }
      } else {
        this._maxRange = this._itemSpase * 2 + dataList.length * this._itemMinRange
      }

      let containerPos = this.scrollNode.getInnerContainerPosition()
      let containerSize = this.scrollNode.getInnerContainerSize()
      let precent = this.getPercent()

      this._refreshItemAll(0)

      if (keepStatic === true) { //处理异常情况
        cc.log('Static Check oldMaxRange =' + oldMaxRange + ' now =' + this._showRange)
        keepStatic = (oldMaxRange && oldMaxRange > this._showRange && this._maxRange > this._showRange)
      }

      if (this._towards == 0) {
        this.scrollNode.setInnerContainerSize(cc.size(this._maxRange, containerSize.height))
        if (keepStatic) {
          cc.log(' precent =' + precent)
          this.setPercent(precent)
          // cc.log('Static Check oldcontainerPos.x =' + containerPos.x)
          // containerPos.x = containerPos.x / (oldMaxRange - this._showRange) * (this._maxRange - this._showRange)
          // cc.log('Static Check containerPos.x =' + containerPos.x)
          // this.scrollNode.setInnerContainerPosition(containerPos)
        } else if (this._maxRange > this._showRange) {
          this.scrollNode.setInnerContainerPosition(cc.p(this._showRange - this._maxRange, 0))
        }
      } else if (this._towards == 1) {
        this.scrollNode.setInnerContainerSize(cc.size(containerSize.width, this._maxRange))
        if (keepStatic) {
          cc.log(' precent =' + precent)
          this.setPercent(precent)
          //cc.log('Static Check oldcontainerPos.y =' + containerPos.y)
          //containerPos.y = containerPos.y / (oldMaxRange - this._showRange) * (this._maxRange - this._showRange)
          //cc.log('Static Check containerPos.y =' + containerPos.y)
          //this.scrollNode.setInnerContainerPosition(containerPos)
        } else if (this._maxRange > this._showRange) {
          this.scrollNode.setInnerContainerPosition(cc.p(0, this._showRange - this._maxRange))
        }
      }

    },
    addDataList: function (dataList) {
      if (!dataList instanceof Array) return
      if (this._dataList.length < this._childrenList.length) {
        this.setDataList(this._dataList.concat(dataList))
        return
      }
      let oldlistlength = this._dataList.length
      this._dataList = this._dataList.concat(dataList)

      let addrange = 0
      if (this._itemSizeFunction) {
        for (let i in dataList) {
          let itemsize = this._itemSizeFunction(this.childrenNode, dataList[i])
          if (this._towards == 0) {
            addrange += itemsize.width + this._itemSpase
          } else if (this._towards == 1) {
            addrange += itemsize.height + this._itemSpase
          }
        }
      } else {
        addrange = dataList.length * this._itemMinRange
      }

      let percent = (this._maxRange - this._showRange) / (this._maxRange - this._showRange + addrange)
      this._maxRange += addrange

      let containerSize = this.scrollNode.getInnerContainerSize()
      let containerPos = this.scrollNode.getInnerContainerPosition()
      this.scrollNode.stopAutoScroll()
      if (this._towards == 0) {
        this.scrollNode.setInnerContainerSize(cc.size(this._maxRange, containerSize.height))
        this.scrollNode.setInnerContainerPosition(cc.p(containerPos.x - addrange, containerPos.y))
      } else if (this._towards == 1) {
        this.scrollNode.setInnerContainerSize(cc.size(containerSize.width, this._maxRange))
        this.scrollNode.setInnerContainerPosition(cc.p(containerPos.x, containerPos.y - addrange))
      }
      //this.scrollNode.scrollToPercentVertical(percent, 0.01, false)

      for (let i = 0; i < this._childrenList.length; i++) {
        let item = this._childrenList[i]
        let index = this._itemShowingBeginNum + i
        if (index >= oldlistlength) {
          let itemindex = -1
          let data = undefined
          if (index >= 0 && index < this._dataList.length) {
            itemindex = this._bReverseList ? (this._dataList.length - 1 - index) : index
            data = this._dataList[itemindex]
          }
          this._updateItemWithData(item, itemindex, data)

          let itemsize = undefined
          if (this._itemSizeFunction) {
            itemsize = this._itemSizeFunction(this.childrenNode, data)
          } else {
            itemsize = this.childrenNode.getContentSize()
          }

          if (i === 0) {
            if (this._maxRange < this._showRange) {
              item.setPositionY(this._showRange - this._itemSpase - itemsize.width / 2)
            } else {
              item.setPositionY(this._maxRange - this._itemSpase - itemsize.width / 2)
            }
          } else {
            let laseitem = this._childrenList[i - 1]
            item.setPositionY(laseitem.getPosition().y - laseitem.getContentSize().height / 2 - this._itemSpase - itemsize.width / 2)
          }
        } else {
          item.setPositionY(item.getPosition().y + addrange)
        }
      }

      this._changeItemDt(-1)
    },
    // 设置是否反向排列
    setDataRevert: function (bRevert) {
      if (this._bReverseList == bRevert) return
      this._bReverseList = bRevert

      for (let i = 0; i < this._childrenList.length; i++) {
        let item = this._childrenList[i]
        item._showingindex = undefined
      }

      this._refreshItemAll(this._itemShowingBeginNum)
    },
    // 获得最大滚动区域
    getMaxScrollRange: function () {
      return this._maxRange
    },
    // 获得显示区域
    getScrollViewRange: function () {
      return this._showRange
    },
    // 获取当前显示位置（百分比0-1）
    getPercent: function () {
      // this._maxRange - this._showRange
      let containerSize = this.scrollNode.getInnerContainerSize()
      let containerPos = this.scrollNode.getInnerContainerPosition()
      if (this._towards == 0) {
        return containerPos.x / containerSize.width
      } else if (this._towards == 1) {
        return -containerPos.y / containerSize.height
      }
    },
    // 设置当前显示位置（百分比0-1）
    setPercent: function (percent) {
      let containerSize = this.scrollNode.getInnerContainerSize()
      let containerPos = this.scrollNode.getInnerContainerPosition()
      if (this._towards == 0) {
        this.scrollNode.setInnerContainerPosition(cc.p(containerSize.width * percent, containerPos.y))
      } else if (this._towards == 1) {
        this.scrollNode.setInnerContainerPosition(cc.p(containerPos.x, -containerSize.height * percent))
      }
    }
  }

  let __protected__ = {
    scrollNode: null,
    childrenNode: null,
    _towards: 0,
    _showRange: 0,
    _itemMinRange: 0,
    _maxRange: 0,
    _itemSpase: 0,
    _itemShowMaxNum: 0,
    _itemShowingBeginNum: 0,
    _bReverseList: false,
    _childrenList: [],
    _dataList: [],
    _itemSizeFunction: null,
    _dataInitFunction: null,
    _dataChangeFunction: null,

    virtual: {
      _refreshItemAll: function (firstindex) {
        this._itemShowingBeginNum = firstindex
        let nextpos = this._itemSpase + firstindex * this._itemMinRange
        if (this._towards == 1) {
          nextpos = this._maxRange - nextpos
          if (this._maxRange < this._showRange) nextpos += this._showRange - this._maxRange
        }

        for (let index = 0; index < this._childrenList.length; index++) {
          let item = this._childrenList[index]
          let itemindex = -1
          let data = undefined
          if (firstindex + index >= 0 && firstindex + index < this._dataList.length) {
            itemindex = this._bReverseList ? (this._dataList.length - 1 - firstindex - index) : firstindex + index
            data = this._dataList[itemindex]
          }
          this._updateItemWithData(item, itemindex, data)

          let itemsize = undefined
          if (this._itemSizeFunction) {
            itemsize = this._itemSizeFunction(this.childrenNode, data)
          } else {
            itemsize = this.childrenNode.getContentSize()
          }
          if (this._towards == 0) {
            item.setPositionX(nextpos + itemsize.width / 2)
            nextpos = nextpos + itemsize.width + this._itemSpase
          } else if (this._towards == 1) {
            item.setPositionY(nextpos - itemsize.height / 2)
            nextpos = nextpos - itemsize.height - this._itemSpase
          }
        }
      },
      _changeItemDt: function (indexdt) {
        if (indexdt > 0) {
          for (let i = 0; i < indexdt; i++) {
            let showindex = this._itemShowingBeginNum + this._childrenList.length + i
            let enditem = this._childrenList[this._childrenList.length - 1]
            let movingItem = this._childrenList.shift()
            this._childrenList.push(movingItem)

            let itemindex = this._bReverseList ? (this._dataList.length - 1 - showindex) : showindex
            let data = (showindex >= 0 && showindex < this._dataList.length) ? this._dataList[itemindex] : undefined
            this._updateItemWithData(movingItem, itemindex, data)

            if (this._towards == 0) {
              movingItem.setPositionX(enditem.getPosition().x + enditem.getContentSize().width / 2 + this._itemSpase + movingItem.getContentSize().width / 2)
            } else if (this._towards == 1) {
              movingItem.setPositionY(enditem.getPosition().y - enditem.getContentSize().height / 2 - this._itemSpase - movingItem.getContentSize().height / 2)
            }
          }
        } else {
          for (let i = 1; i <= -indexdt; i++) {
            let showindex = this._itemShowingBeginNum - i
            let startitem = this._childrenList[0]
            let movingItem = this._childrenList.pop()
            this._childrenList.unshift(movingItem)

            let itemindex = this._bReverseList ? (this._dataList.length - 1 - showindex) : showindex
            let data = (showindex >= 0 && showindex < this._dataList.length) ? this._dataList[itemindex] : undefined
            this._updateItemWithData(movingItem, itemindex, data)

            if (this._towards == 0) {
              movingItem.setPositionX(startitem.getPosition().x - startitem.getContentSize().width / 2 - this._itemSpase - movingItem.getContentSize().width / 2)
            } else if (this._towards == 1) {
              movingItem.setPositionY(startitem.getPosition().y + startitem.getContentSize().height / 2 + this._itemSpase + movingItem.getContentSize().height / 2)
            }
          }
        }
        this._itemShowingBeginNum += indexdt
      }
    },
    _updateItemWithData: function (item, index, data) {
      if (data === undefined) {
        item.setVisible(false)
        return
      }
      item.setVisible(true)
      if (item._showingindex !== index) {
        item._showingindex = index
        if (this._bReverseList) {
          this._dataChangeFunction(index, item, data)
        } else {
          this._dataChangeFunction(index, item, data)
        }
      }
    }
  }

  let __private__ = {
    _update: function (dt) {
      if (!this._dataList || (this._towards !== 0 && this._towards !== 1)) return
      let innerContainerPos
      let innerPosBorder
      let again

      if (this._towards == 0) {
        innerContainerPos = -this.scrollNode.getInnerContainerPosition().x
        do {
          again = false
          let minitem = this._childrenList[0]
          innerPosBorder = minitem.getPosition().x - (minitem.getContentSize().width + this._itemSpase) / 2

          if (innerContainerPos < innerPosBorder) {
            if (this._itemSizeFunction) {
              this._changeItemDt(-1)
              again = true
            } else {
              let dtindex = 1 + Math.floor((innerPosBorder - innerContainerPos) / this._itemMinRange)
              if (dtindex >= this._childrenList.length) {
                this._refreshItemAll(this._itemShowingBeginNum + dtindex)
              } else {
                this._changeItemDt(-dtindex)
              }
            }
          }
        } while (again)

        do {
          again = false
          let maxitem = this._childrenList[this._childrenList.length - 1]
          innerPosBorder = maxitem.getPosition().x + (maxitem.getContentSize().width + this._itemSpase) / 2

          if (innerContainerPos + this._showRange > innerPosBorder) {
            if (this._itemSizeFunction) {
              this._changeItemDt(1)
              again = true
            } else {
              let dtindex = 1 + Math.floor((innerContainerPos + this._showRange - innerPosBorder) / this._itemMinRange)
              if (dtindex >= this._childrenList.length) {
                this._refreshItemAll(this._itemShowingBeginNum + dtindex)
              } else {
                this._changeItemDt(+dtindex)
              }
            }
          }
        } while (again)

      } else if (this._towards == 1) {
        innerContainerPos = -this.scrollNode.getInnerContainerPosition().y
        do {
          again = false
          let maxitem = this._childrenList[0]
          innerPosBorder = maxitem.getPosition().y + (maxitem.getContentSize().height + this._itemSpase) / 2

          if (innerContainerPos + this._showRange > innerPosBorder) {
            if (this._itemSizeFunction) {
              this._changeItemDt(-1)
              again = true
            } else {
              let dtindex = 1 + Math.floor((innerContainerPos + this._showRange - innerPosBorder) / this._itemMinRange)
              if (dtindex >= this._childrenList.length) {
                this._refreshItemAll(this._itemShowingBeginNum - dtindex)
              } else {
                this._changeItemDt(-dtindex)
              }
            }
          }
        } while (again)

        do {
          again = false
          let minitem = this._childrenList[this._childrenList.length - 1]
          innerPosBorder = minitem.getPosition().y - (minitem.getContentSize().height + this._itemSpase) / 2
          if (innerContainerPos < innerPosBorder) {
            if (this._itemSizeFunction) {
              this._changeItemDt(1)
              again = true
            } else {
              let dtindex = 1 + Math.floor((innerPosBorder - innerContainerPos) / this._itemMinRange)
              if (dtindex >= this._childrenList.length) {
                this._refreshItemAll(this._itemShowingBeginNum + dtindex)
              } else {
                this._changeItemDt(dtindex)
              }
            }
          }
        } while (again)
      }
    }
  }

  JSPP.ppclass('ScrollViewEx', __public__, __protected__, __private__)

})