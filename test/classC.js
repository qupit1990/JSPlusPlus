(function(){

JSPP.ppinclude(':/../testcode/classB.js')

var _public ={
	static:{
		pb_s_value : 0.1,
		pb_s_function:function(){
			console.log('[classB] called pb_s_function  pb_s_value: '+this.pb_s_value)
		}
	},
	classC:function(){
		console.log('['+this.pv_myClass+'] called init()')
		//this.pprelease()
		//this.ppretain()
	},
	_classC:function(){
		console.log('['+this.pv_myClass+'] called free()')
	},
	virtual:{
		pb_v_function:function(){
			this.ppsuper()
			console.log('['+this.pv_myClass+'] called pb_v_function')
		}
	},
	pb_v_zerofunction:function(){
		console.log('['+this.pv_myClass+'] called pb_v_zerofunction pv_aNumber is '+this.pv_aNumber)
	},
	pb_aNumber: 10,
	pb_function:function(){
		console.log('['+this.pv_myClass+'] called pb_function pv_aNumber is '+this.pv_aNumber)
	},
	pb_changepv_aNumber:function(value){
		this.pv_aNumber = value
	},
	pb_changept_aNumber:function(value){
		this.pt_aNumber = value
	}
}

var _protected ={
	static:{
		pt_s_function:function(){
			console.log('[classC] called pt_s_function')
		}
	},
	virtual:{
		pt_v_function:function(){
			console.log('['+this.pv_myClass+'] called pt_v_function')
		}		
	}
}

var _private ={
	static:{
		pv_s_function:function(){
			console.log('[classC] called pv_s_function')
		}
	},
	pv_myClass: 'classC',
	pv_aNumber: 10
}

var classObj = JSPP.ppclass("classC","classB",_public,_protected,_private)

classObj.public.pb_bNumber = 20

classObj.public.pb_showbNumber = function(){
	console.log('['+this.pv_myClass+'] pb_showbNumber => '+this.pb_bNumber)
}

classObj.protected.pt_bNumber = 20
classObj.private.pv_bNumber = 20

})()