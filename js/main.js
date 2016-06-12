// Initialize Firebase

var config = {
    apiKey: "AIzaSyBf43dSNHvQRZZIufoOiMi_h5Gm-lRtFfE",
    authDomain: "project-7278713962723204241.firebaseapp.com",
    databaseURL: "https://project-7278713962723204241.firebaseio.com",
    storageBucket: "project-7278713962723204241.appspot.com",
};
firebase.initializeApp(config);
ImageDealer.REF = firebase;
var User;
var UserId;
var picURL;
var database = firebase.database();
var fbProvider = new firebase.auth.FacebookAuthProvider();
var uploadModal = new UploadModal($("#upload-modal"));
var viewModal = new ViewModal($("#view-modal"));

function saveItems(title, price, descrip) {
    console.log("upload");
    var currentUserid = firebase.auth().currentUser.uid;
    var currentUserName = firebase.auth().currentUser.displayName;
    var data = {
        "title": title,
        "price": parseInt(price),
        "descrip": descrip,
        "userTime": new Date($.now()).toLocaleString(),
        "seller": currentUserid,
        "sellerName": currentUserName
    };
    var itemID = firebase.database().ref("Items/").push(data).key;
    var updateitem = firebase.database().ref("Users/").child(currentUserid + "/sellItems/" + itemID);
    updateitem.set(data);
    uploadModal._currentItemKey = itemID;
    uploadModal.submitPic(firebase.auth().currentUser.uid);
}

// ----------------------------login---------------------------------
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        logginOption(true);
    } else {
        logginOption(false);
    }
});

$("#signin").click(function() {
    firebase.auth().signInWithPopup(fbProvider).then(function(result) {
        firebase.database().ref("Users/" + result.user.uid).update({
            name: result.user.displayName,
            ID: result.user.uid,
            photo: result.user.photoURL,
            sellItems: null,
            UserFirstLoginTime: new Date($.now()).toLocaleString()
        });
        UserId = result.user.uid;
        User = result.user.displayName;
        console.log(result);
        logginOption(true);
    }).catch(function(error) {
        var errorCode = error.code;
        var errorMessa = error.message;
        console.log(errorCode, errorMessa);
    })
});

$("#signout").click(function() {
    firebase.auth().signOut().then(function() {
        logginOption(false);
        firebase.database().ref("Items/").once("value", reProduceAll);
        console.log("click signout");
        logginOption(false);
        User = null;
        UserId = null;
    }, function(error) {
        console.log(error.code);
    });
});

function logginOption(isLoggin) {
    if (isLoggin) {
        $("#upload").css("display", "block");
        $("#signin").css("display", "none");
        $("#signout").css("display", "block");
    } else {
        $("#upload").css("display", "none");
        $("#signin").css("display", "block");
        $("#signout").css("display", "none");
    }
}

// --------------------------- login --------------------------------

// -------------------------- item edit -----------------------------

$("#submitData").click(function() {
    // 上傳新商品
    var dataArr = $("#item-info").serializeArray();
    var picFile = $("#picData")[0].files[0];
    if (dataArr[0].value != "" && dataArr[1].value != "" && dataArr[2].value != "" && picFile) {
        //check if it is picture(not yet)
        saveItems(dataArr[0].value, dataArr[1].value, dataArr[2].value);
        console.log("finish submit");
        $("#upload-modal").modal('hide');
    }

});



$("#removeData").click(function() {
    firebase.database().ref("Items").child(nowItem).once("value", function(item) {
        var userid = item.val().seller;
        firebase.database().ref("Users/" + userid + "/sellItems/" + nowItem).remove();
        uploadModal._currentItemKey = nowItem;
        uploadModal.deletePic(userid);
    });
    var curr = firebase.database().ref("Items").child(nowItem);
    curr.remove();
    $("#upload-modal").modal('hide');
});


// --------------------------------------------------------

firebase.database().ref("Items/").on("value", reProduceAll);

function reProduceAll(allItems) {
    var allData = allItems.val();
    $("#items").empty();
    for (var itemData in allData)
    {
        allData[itemData].itemKey = itemData;
        produceSingleItem(allData[itemData]);
    }
}
function produceSingleItem(Data) {
    var currentUser = firebase.auth().currentUser;
    var thisitem = Data;
    var product = new Item({
        "title": thisitem.title,
        "price": thisitem.price,
        "itemKey": Data.itemKey,
        "seller": thisitem.seller,
        "sellerName": thisitem.sellerName
    }, currentUser);
    $("#items").append(product.dom);
    $(product.editBtn).click(function(snapshot) {
        uploadModal.clear;
        firebase.database().ref("Items/" + product.itemKey + "/").once("value", function(item) {
            nowItem = product.itemKey;
            uploadModal.callImage(product.itemKey, item.val().seller);
            uploadModal.editData(item.val());
        });
    });
    $(product.viewBtn).click(function(snapshot) {
        viewModal.clear;
        firebase.database().ref("Items/" + product.itemKey + "/").once("value", function(item) {
            viewModal.callImage(product.itemKey, thisitem.seller);
            viewModal.writeData(item.val());

        });
        var messBox = new MessageBox(firebase.auth().currentUser, Data.itemKey);
        $("#message").append(messBox.dom);
        msgLog(Data.itemKey, messBox);
        /*
          判斷使用者是否有登入，如果有登入就讓 #message 容器顯示輸入框。
          在 MessageBox 上面註冊事件，當 submit 時將資料上傳。
          */

        if (currentUser) {

            $("#message").append(messBox.inputBox);
            messBox.inputBox.keypress(function(e) {
                if (e.which == 13) {
                    e.preventDefault();
                    var userdialog = $(this).find("#dialog").val();
                    var currentUserid = firebase.auth().currentUser.uid;
                    var currentUserName = firebase.auth().currentUser.displayName;
                    firebase.database().ref("Users/" + currentUserid + "/").once("value", function(item) {
                        picURL = item.val().photo;
                        var message = {
                            "message": userdialog,
                            "userTime": new Date().getTime(),
                            "talkerID": currentUserid,
                            "talkerName": currentUserName,
                            "picture": picURL
                        };
                        var newmessage = firebase.database().ref("Items/").child(product.itemKey + "/Messages");
                        newmessage.push(message);
                        viewModal.callImage(Data.itemKey, thisitem.seller);
                    });
                    $(this).find("#dialog").val("");
                }
            });
        }
    });
}


function msgLog(diaDatakey, messageBox) {
    firebase.database().ref("Items/" + diaDatakey + "/Messages/").orderByChild("userTime").on("value", function(data) {
        messageBox.refresh();
        var messages = data.val()
        for (var messageKey in messages) {
            if (messages.hasOwnProperty(messageKey)) {
                var singleMessage = messages[messageKey];
                messageBox.addDialog({
                    "message": singleMessage.message,
                    "time": singleMessage.userTime,
                    "name": singleMessage.talkerName,
                    "picURL": singleMessage.picture
                });
            }
        }
    });
}

// ------------------------ view -------------------------------
$("#SelectPrice li:nth-of-type(1)").click(function(event) {
    firebase.database().ref("Items").once("value", reProduceAll);
});

$("#SelectPrice li:nth-child(2)").click(function(event) {
    firebase.database().ref("Items").orderByChild("price").startAt(10000).once("value", reProduceAll);
});

$("#SelectPrice li:nth-of-type(3)").click(function(event) {
    firebase.database().ref("Items").orderByChild("price").endAt(9999).once("value", reProduceAll);
});

function viewAllItems() {
    firebase.database().ref("Items").once("value", reProduceAll);
}
