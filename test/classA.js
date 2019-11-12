(function(){
		
var _public ={
	static:{
		pb_s_value : 10,
		pb_s_function:function(){
			console.log('[classA] called pb_s_function  pb_s_value: '+this.pb_s_value)
		}
	},
	classA:function(){
		console.log('['+this.pv_myClass+'] called init()')
	},
	virtual:{
		_classA:function(){
			console.log('['+this.pv_myClass+'] called free()')
		},
		pb_v_function:function(){
			this.pt_v_function()
			console.log('['+this.pv_myClass+'] called pb_v_function')
		},
		pb_v_zerofunction:0
	},
	pb_aNumber: 1000,
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
		static:function(){
			console.log('[classA] static is Init')
		}
		_static:function(){
			console.log('[classA] static is Delete')
		}
		pt_s_function:function(){
			console.log('[classA] called pt_s_function')
		}
	},
	virtual:{
		pt_v_function:function(){
			console.log('['+this.pv_myClass+'] called pt_v_function')
		}		
	},
	pt_aNumber: 1000	
}

var _private ={
	static:{
		pv_s_function:function(){
			console.log('[classA] called pv_s_function')
		}
	},
	pv_myClass: 'classA',
	pv_aNumber: 1000
}

var classObj = JSPP.ppclass("classA",_public,_protected,_private)

classObj.public.pb_bNumber = 2000
classObj.protected.pt_bNumber = 2000
classObj.private.pv_bNumber = 2000

})()