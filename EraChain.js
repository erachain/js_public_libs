const ECError = {
    KeyIsIncorrect : 0,
    SignatureIncorrect : 1,
    SendMessageError : 2
}

const ProcessType = {
    Telegram : 0,
    Transaction : 1
}

//================================================основной класс библиотки EraChain ==============================
class EraChain {
    //конструктор класса
    constructor( _publicKey, _toAddress, _nodeUrl ) {
        this.setKeyPair( _publicKey );
        this.toAddress = _toAddress;
        this.nodeUrl = _nodeUrl;
    }

    // _ket - строка приватного ключа в кодировке Base58
    setKeyPair(_key) {
        if ( typeof(_key) == "string" ) {
            _key = new Uint8Array(Base58.decode(_key));
        } else {
            throw ECError.KeyIsIncorrect;
        }
        var _keyPair = nacl.sign.keyPair.fromSecretKey(_key);
        this.keyPair = {
            privateKey: _keyPair.secretKey,
            publicKey: _keyPair.publicKey
        }
    }

    //
    // _ISOcurr - ISO код валюты Инвойса
    // _sumInvoice - сумма Инвойса
    // _userID - идентификационный номер пользователя (номер телефона или email)
    // _json - JSON согластно спецификации к Схеме 2 для "Безопастный платеж"
    // _recipient - адрес получателя, для магазина указывается единый адрес, 
    //              для отправки платежа банком указывается адрес кошелька магазина - 
    //                подставляется автоматически
    // _timestamp - время отправки сообщения в UNIX формате timestamp
    //
    // возвращает массив из двух элементов 
    // 1 - транзакция
    // 2 - подпись
    buildRaw(_ISOcurr, _sumInvoice, _userID, _json, _timestamp, _recipient ) {
        // timestamp - момент формирования сообщения
        var timestamp = _timestamp;
        // адрес получателя сообщения
        var recipientAccountAddress;
        if ( _recipient === null ) {
            recipientAccountAddress = this.toAddress;
        } else {
            recipientAccountAddress = _recipient;
        }
        // ISO код валюты Инвойса
        var assetKey =_ISOcurr;
        // сумма Инвойса
        var quantity = _sumInvoice;
        // ID покупателя
        var title = _userID;
        // JSON или любой другой текст 
        var message = _json.toString();
        // no enscript
        var enscript = [0];
        // text
        var isText =[1];
        // Era Chain Port
        var port = this.getUrlPort();
        // создание байткода транзакции в кодировке Base 58 (этот код далее методом POST на адрес API отправляется)	
        // возвращается массив [Base58 байткод, signature - подпись транзакции]
        return generate_R_Send_TransactionBase(this.keyPair, recipientAccountAddress, assetKey, quantity, timestamp, title, message, enscript, isText, port);
    }

    //служебная функция для добавления номера порта в транзакцию
    getUrlPort() {
        var url = new URL(this.nodeUrl);
        if (url.port == 9067) {
            return 9066;
        } else {
            return 9046;
        }
    }
    
    // получение UNIX timestamp со смещением UTC +0
    getTimestamp() {
        var date = new Date();
        return date.getTime();
    }
}

//=============================================== класс вспомогательный EraChain Invoice============================
class EraChainInvoice extends EraChain {
    //
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
    constructor( _publicKey, _toAddress, _nodeUrl ) {
        super(_publicKey, _toAddress, _nodeUrl);
    }

    buildMessage(_ISOcurr, _sumInvoice, _userID, _orderID,  _recipient, _expire, _title, _paymentDetails, _description, _operation ) {
        let _timestamp = this.getTimestamp();
        if ( _ISOcurr === null ) {
            _ISOcurr = 0;
        }
        if ( _sumInvoice === null ) {
            _sumInvoice = 0;
        }
        if ( _orderID === null ) {
            _orderID = 0;
        }
        if ( _expire === null ) {
            _expire = _timestamp + 24 * 60000;
        }
        if ( _title === null ) {
            _title = "-";
        }
        if ( _description === null ) {
            _description = "-";
        }
        if ( _operation === null ) {0
            _operation = "regular";
        }
        var _json; 
        if (_operation === "regular") {
            _json = {
                "date": _timestamp,
                "order": _orderID,
                "user": _userID,
                "curr": _ISOcurr,
                "sum": _sumInvoice,
                "expire": _expire,
                "title": _title,
                "paymentDetails": _paymentDetails,
                "description": _description,
            }
        } else {
            _json = { "operation": _operation }; 
        }
        return this.buildRaw(_ISOcurr, _sumInvoice, _userID, JSON.stringify(_json), _timestamp, _recipient );
    }

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
    buildBankMessage(_ISOcurr, _sumInvoice, _userID,  _recipient, _signature, _bankSignature, _pkey, _orderSignature, _sum ) {
        let _timestamp = this.getTimestamp();
        if ( _ISOcurr === null ) {
            _ISOcurr = 0;
        }
        if ( _sumInvoice === null ) {
            _sumInvoice = 0;
        }
        if ( _sum === null ) {
            _sum = 0;
        }
        var _json; 
        _json = {
            "date": _timestamp,
            "signature": _signature,
            "bankSignature": _bankSignature,
            "orderSignature": _orderSignature,
            "pkey": _pkey,
            "sumInvoice": _sumInvoice,
            "sumPayment": _sum,
        }
        return this.buildRaw(_ISOcurr, _sumInvoice, _userID, JSON.stringify(_json), _timestamp, _recipient );
    }

}

//=============================================== функции по формированию транзакций ===============================
// send asset transaction
// keyPair 		- pair public key + security key (byte64, byte32)
// recipient	- recipient (byte[25])
// asset_key	- asset Key (Long)
// amount		- Ammount    (Float); null
// timestamp	- Unix timestamp (Long). 1514529622881
// title		- Title (String)
// message		- Message (String); null
// enscript		- 0 not enscript; 1 enscript
// is_text		- 1
// port 		- ERA network PORT 9046 or dev:9066 (int)
// generate_R_Send_TransactionBase(keyPair, recipient, 1, 10.000001, 1514529622881, "Title", "Message", 0, 1, 9066)
// return byte[]
function generate_R_Send_TransactionBase( keyPair, recipient, asset_key, amount, timestamp, title, message, enscript, is_text, port ) {
    // type transaction
	//console.log("keyPair:" + keyPair + "; recipient" + recipient + "; asset_key:" + asset_key + "; amount:" + amount + "; timestamp:" +
	//			timestamp + "; title:" + title + "; message:" + message + "; enscript:" + enscript + "; is_text:" + is_text + "; port:" + port);
	// referens
	const lastReferenceByte = [0,0,0,0,0,0,0,0];
	// Fee param
	const fee_c = [0];
	var data1 = new Uint8Array();
	data1 = appendBuffer(data1, Base58.decode(recipient));
	// Asset key
	data1 = appendBuffer(data1, int64ToBytes(asset_key));
	// amount  10.20 * 100000000
	var  am = -1;
	if (amount != 0 && amount != null){
	    data1 = appendBuffer(data1, int64ToBytes(parseFloat(amount) * 100000000));
	    am = 0;
	}
	// Title 
	var arr = toUTF8Array(title);
	data1 = appendBuffer(data1, [arr.length]);
	data1 = appendBuffer(data1, arr);
	// Message
	mes = -1;
	if (message != null && message !="") {
	arr = toUTF8Array(message);
	data1 = appendBuffer(data1, int32ToBytes(arr.length));
	data1 = appendBuffer(data1, arr);
	data1 = appendBuffer(data1, enscript);
	data1 = appendBuffer(data1, is_text);
	mes = 0; // with amount
	}
	var typeBytes = [31,0,am,mes]; // with amount
	var data0 = new Uint8Array();
	data0 = tobyteBasePart(typeBytes, int64ToBytes(timestamp), lastReferenceByte, keyPair.publicKey, fee_c);
	return toByteEndPart(data0, data1, keyPair.privateKey, port );
}

//============================================================вспомогательные функции ============================
function toUTF8Array(str) {
    var utf8 = [];
    if (str != undefined ) {
        for (var i=0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6), 
                  0x80 | (charcode & 0x3f));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12), 
                  0x80 | ((charcode>>6) & 0x3f), 
                  0x80 | (charcode & 0x3f));
            }
            // surrogate pair
            else {
                i++;
                // UTF-16 encodes 0x10000-0x10FFFF by
                // subtracting 0x10000 and splitting the
                // 20 bits of 0x0-0xFFFFF into two halves
                charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
                utf8.push(0xf0 | (charcode >>18), 
                    0x80 | ((charcode>>12) & 0x3f), 
                    0x80 | ((charcode>>6) & 0x3f), 
                    0x80 | (charcode & 0x3f));
            }
        }
    }
    return utf8;
}

function appendBuffer (buffer1, buffer2) {
	buffer1 = new Uint8Array(buffer1);
	buffer2 = new Uint8Array(buffer2);
	var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(buffer1, 0);
	tmp.set(buffer2, buffer1.byteLength);
	return tmp;
}

function int64ToBytes (int64) {
    // we want to represent the input as a 8-bytes array
    let byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
    for ( let index = 0; index < byteArray.length; index ++ ) {
        let byte = int64 & 0xff;
        byteArray [ byteArray.length - index - 1 ] = byte;
        int64 = (int64 - byte) / 256 ;
    }

    return byteArray;
}

function int32ToBytes (word) {
	var byteArray = [];
	for (var b = 0; b < 32; b += 8) {
		byteArray.push((word >>> (24 - b % 32)) & 0xFF);
	}
	return byteArray;
}

function tobyteBasePart(typeBytes, timestampBytes, lastReferenceByte, publicKey, fee_c) {
	var data3 = new Uint8Array();
	// sign data
	data3 = appendBuffer(data3, typeBytes);
	data3 = appendBuffer(data3, timestampBytes);
	data3 = appendBuffer(data3, lastReferenceByte);
	data3 = appendBuffer(data3, publicKey);
	data3 = appendBuffer(data3, fee_c);
	return data3;
}

function toByteEndPart(data0, data1, privateKey, port ) {
	var data = new Uint8Array();
	data = appendBuffer(data, data0);
	data = appendBuffer(data, data1);
	data = appendBuffer(data, int32ToBytes(port));
	var signature = nacl.sign.detached(data, privateKey);
	if (signature.length != 64) {
		alert("Signature is incorrect.");
		return;
	}
	var sss = Base58.encode(signature);
	// raw teransaction R_Send
    data = new Uint8Array();	
	data = appendBuffer(data, data0);
	data = appendBuffer(data, signature);
    data = appendBuffer(data, data1);
	return [Base58.encode(data), sss];
}

function generateAccountSeed(seed, nonce, returnBase58) {
	if(typeof(seed) == "string") {
		seed = Base58.decode(seed);
	}
	nonceBytes = int32ToBytes(nonce);
	var resultSeed = new Uint8Array();
	resultSeed = appendBuffer(resultSeed, nonceBytes);
	resultSeed = appendBuffer(resultSeed, seed);
	resultSeed = appendBuffer(resultSeed, nonceBytes);
	if (returnBase58) {
		return Base58.encode(SHA256.digest(SHA256.digest(resultSeed)));
	} else {
		return new SHA256.digest(SHA256.digest(resultSeed));
	}
}

function getKeyPairFromSeed(seed, returnBase58) {
	if(typeof(seed) == "string") {
		seed = new Uint8Array(Base58.decode(seed));
	}
	var keyPair = nacl.sign.keyPair.fromSeed(seed);
	if(returnBase58) {
		return {
			privateKey: Base58.encode(keyPair.secretKey),
			publicKey: Base58.encode(keyPair.publicKey)
		};
	} else {
		return {
			privateKey: keyPair.secretKey,
			publicKey: keyPair.publicKey
		};
	}
}

function getAccountAddressFromPublicKey(publicKey) {
	let ADDRESS_VERSION = 15; 
	if (typeof(publicKey) == "string") {
		publicKey = Base58.decode(publicKey);
	}
	let publicKeyHashSHA256 = SHA256.digest(publicKey);
	let ripemd160 = new RIPEMD160();
	let publicKeyHash = ripemd160.digest(publicKeyHashSHA256);
	let addressArray = new Uint8Array();
	addressArray = appendBuffer(addressArray, [ADDRESS_VERSION]);
	addressArray = appendBuffer(addressArray, publicKeyHash);
	let checkSum = SHA256.digest(SHA256.digest(addressArray));
	addressArray = appendBuffer(addressArray, checkSum.subarray(0, 4));
	return Base58.encode(addressArray);
}

function getSharedSecret(privateKey, secondPublicKey) {
    return nacl.scalarMult(ed2curve.convertSecretKey(privateKey),ed2curve.convertSecretKey(secondPublicKey));
}