SAGE2_AppState = {
    callFunctionInContainer: function(nameOfFunction, value){
        this.send({s2:'functionCall',nameOfFunction,value});
    },
    callFunctionInComponent: function(message){
        window[message.nameOfComponent][message.nameOfFunction](message.value);
    },
    send:function(message){
        console.log(JSON.stringify(message));
    },
}