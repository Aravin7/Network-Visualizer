SAGE2_AppState = {
    callFunctionInContainer: function(nameOfFunction, value){
        this.send({s2:'functionCall',nameOfFunction,value});
    },
    callFunctionInComponent: function(message){
        try{
        window[message.nameOfComponent][message.nameOfFunction](message.value);
        }catch(error){
            console.log("ERROR> SAGE2_AppState> Webpage attempted to call function: " + message.nameOfFunction + ". But it doesn't exist.");
        }
    },
    send:function(message){
        console.log(JSON.stringify(message));
    },
}