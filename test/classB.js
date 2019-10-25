(function(){

JSPP.ppinclude(':/../testcode/classA.js')

var _public ={
	static:{
		pb_s_value : 1,
		pb_s_function:function(){
			console.log('[classB] called pb_s_function  pb_s_value: '+this.pb_s_value)
		}
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
	pb_aNumber: 100,
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
			console.log('[classB] called pt_s_function')
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
			console.log('[classB] called pv_s_function')
		}
	},
	pv_myClass: 'classB',
	pv_aNumber: 100
}

var classObj = JSPP.ppclass("classB","classA",_public,_protected,_private)

classObj.public.pb_bNumber = 200

classObj.public.pb_showbNumber = function(){
	console.log('['+this.pv_myClass+'] pb_showbNumber => '+this.pb_bNumber)
}

classObj.protected.pt_bNumber = 200
classObj.private.pv_bNumber = 200

})()