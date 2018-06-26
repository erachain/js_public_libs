//=============================================== функции по отправке и получении данных по сети ===================
//=============================================== используется для тестирования ====================================
//в конструктор класса передается:
// - первый параметр : приватный ключ кошелька, 
// - второй параметр : дрес кошелька (предоставляется нами, 
//      специальный кошелек созданный для идентификации данного вида транзакции / 
//      в примере использован кошелек из версии для разработчиков
// - третий параметр : адрес API (или RPC) ноды
let eraChain = new EraChainInvoice("3aoxJdks5ciUS18w4GhEWDK1EJVJyA2YDKZ8buKd5M7LuSgfjRo5AzhSUMFVVMxmtugESmFBFZHumkpQBcnVULWR", "79MXsjo9DEaxzu6kSvJUauLhmQrB4WogsH", "http://89.235.184.251:9067");
            

//функция получения сообщений по фильтру идентификатора пользователя
function getMessageByFilter(value) {
    httpRequest('GET',  "/apitelegrams/get?filter=" + value + "&address=79MXsjo9DEaxzu6kSvJUauLhmQrB4WogsH" , function(data) {
        document.getElementById('information').innerHTML += "<br>filter result: " + data;
    })
}

//функция получения сообщения по сигнатуре 
function getMessageBySignature(value) {
    httpRequest('GET',  "/apitelegrams/getbysignature/" + value , function(data) {
        document.getElementById('information').innerHTML += "<br>signature result: " + data;
    })
}

//функция получения сообщений для магазина
function getMarketMessageByFilter(value) {
    httpRequest('GET',  "/api/sendassetsfilter?address=" + value , function(data) {
        document.getElementById('information').innerHTML += "<br>filter result: " + data;
    })
}

// пример функции отправки сообщения магазином
function sendMessageShop() {
    // _ISOcurr - ISO код валюты Инвойса, для удаления null
    // _sumInvoice - сумма Инвойса, для удаления null
    // _userID - идентификационный номер пользователя (номер телефона или email)
    // _orderID - идентификационный номер Инвойса, для удаления null
    // _recipient - адрес получателя, для магазина указывается единый адрес, (в этом случае указывается null)
    //              для отправки платежа банком указывается адрес кошелька магазина - 
    //                подставляется автоматически
    // _expire - срок действия заказа, если null - то срок истечения устанавливается от текущего момента + 24 часа
    // _title - Заголовок сообщения, если нет то null
    // _paymentDetails - платежные реквизиты, формат свободный, для удаления null
    // _description - Описание заголовка, если нет то null
    // _operation - null по умолчанию, для сообщения об удалении подписанная строка, содержащая подпись отменяемой транзакции
    //                  delete,signature
    // возвращает массив из двух элементов 
    // 1 - транзакция
    // 2 - подпись
    let txRaw = eraChain.buildMessage(643, 1, "125", "", null, null, null, null, null, null );
    document.getElementById("information").innerHTML += "raw: " + txRaw[0] + "<br>";
    document.getElementById("information").innerHTML += "signature:" + txRaw[1] + "<br>";
    sendTransaction( txRaw[0], ProcessType.Telegram)
    return txRaw[1];
}

// пример функции отправки сообщения банком (оплата получена)
function sendMessageBank() {
    // buldBankMessage   parameters :
    //                               _ISOcurr - ISO код валюты Инвойса, для удаления null
    //                               _sumInvoice - сумма Инвойса, для удаления null
    //                               _userID - идентификационный номер пользователя (номер телефона или email)
    //                               _recipient - адрес получателя, 
    //                                            для отправки платежа банком указывается адрес кошелька магазина - 
    //                                            подставляется автоматически
    //                               _signature - подпись ранее оплаченного заказа
    //                               _bankSignature  - подпись банка
    //                               _pkey           - публичный ключ банка
    //                               _orderSignature - подпись оплаченного заказа
    //                               _sum            - сумма заказа оплаченнная
    let txRaw = eraChain.buildBankMessage(643, 1, "125", "79MXsjo9DEaxzu6kSvJUauLhmQrB4WogsH", "signature", "bankSignature", "pkey", "orderSignature", "payment sum" );
    document.getElementById("information").innerHTML += "raw: " + txRaw[0] + "<br>";
    document.getElementById("information").innerHTML += "signature:" + txRaw[1] + "<br>";
    sendTransaction( txRaw[0], ProcessType.Transaction);
    return txRaw[1];
}

//функция удаления сообщения магазином
function deleteMessage(signature) {
    let txRaw = eraChain.buildMessage(643, 0.01, "125", "", null, null, null, null, null, "delete," + signature );
    document.getElementById("information").innerHTML += "signature:" + txRaw[1] + "<br>";
    sendTransaction( txRaw[0], ProcessType.Transaction)
    return txRaw[1];
}

//функция отправки сообщения / транзакции
function sendTransaction(_txRaw, _type) {
    let _method = "/api/broadcast";
    if ( _type == ProcessType.Telegram) {
        _method = "/api/broadcasttelegram";
    }
    httpRequest('GET', _method + "/" + _txRaw , function(data) {
        document.getElementById('information').innerHTML += "<br>request result: " +data;
    })
}

function httpRequest(_methodType, _methodUrl, _processorFunc) {
    let httpRequest = typeof XMLHttpRequest != 'undefined'
			? new XMLHttpRequest()
		    : new ActiveXObject('Microsoft.XMLHTTP');
	let requestUrl = eraChain.nodeUrl + _methodUrl;
	httpRequest.open(_methodType, requestUrl, true);
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState === XMLHttpRequest.DONE && this.status === 200) {
            _processorFunc(this.responseText);
		} 
	};
	httpRequest.send();
}
