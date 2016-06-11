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

// ----------------------------login---------------------------------

function saveItems(title, price, descrip) {
    var Userid = firebase.auth().currentUser.uid;
    var User = firebase.auth().currentUser.displayName;
    var data = {
        "title": title,
        "price": parseInt(price),
        "descrip": descrip,
        "userTime": new Date($.now()).toLocaleString(),
        "seller": Userid,
        "sellerName": User
    };
    var itemID = firebase.database().ref("Items/").push(data).key;
    var updateitem = firebase.database().ref("Users/").child(Userid + "/sellItems/" + itemID);
    updateitem.set(data);
    uploadModal._currentItemKey = itemID;
    uploadModal.submitPic(firebase.auth().currentUser.uid);
}


function editItems(title, price, descrip, isNewPic) {
    firebase.database().ref("Items/").child(nowItem).once("value", function(item) {
        uploadModal.upload;
        if (isNewPic != null) {
            uploadModal._currentItemKey = nowItem;
            uploadModal.submitPic(item.val().seller);
        }

        firebase.database().ref("Items/").child(nowItem).update({
            "title": title,
            "price": parseInt(price),
            "descrip": descrip,
            "userTime": new Date($.now()).toLocaleString()
        });
        firebase.database().ref("Users/" + item.val().seller + "/sellItems/").child(nowItem).update({
            "title": title,
            "price": parseInt(price),
            "descrip": descrip,
            "userTime": new Date($.now()).toLocaleString()
        });
    });
}

function removeItems() {
    firebase.database().ref("Items").child(nowItem).once("value", function(item) {
        var userid = item.val().seller;
        firebase.database().ref("Users/" + userid + "/sellItems/" + nowItem).remove();
        uploadModal._currentItemKey = nowItem;
        uploadModal.deletePic(userid);
    });
    var curr = firebase.database().ref("Items").child(nowItem);
    curr.remove();
}
$("#submitData").click(function() {
    // var currentUser = firebase.auth().currentUser;
    var dataArr = $("#item-info").serializeArray();
    var picFile = $("#picData")[0].files[0];
    if (dataArr[0].value != "" && dataArr[1].value != "" && dataArr[2].value != "" && picFile) {
        saveItems(dataArr[0].value, dataArr[1].value, dataArr[2].value);
        $("#upload-modal").modal('hide');
    }
    // $("item-info").append(product.dom);
});

$("#editData").click(function() {
    var dataArr = $("#item-info").serializeArray();
    var picFile = $("#picData")[0].files[0];
    if (dataArr[0].value != "" && dataArr[1].value != "" && dataArr[2].value != "") {
        editItems(dataArr[0].value, dataArr[1].value, dataArr[2].value, picFile);
        $("#upload-modal").modal('hide');
    }
})

$("#removeData").click(function() {
    removeItems();
    $("#upload-modal").modal('hide');
})

// $(".picBox").click(function() {

//         var viewModal = new ViewModal($(".picBox"));
//         var uploadModal = new UploadModal($(".picBox"));
//         // uploadModal.submitPic(firebase.auth().currentUser.uid);
//     })

// -------------------------view--------------------------------

/*
 商品按鈕在dropdown-menu中
 三種商品篩選方式：
 1. 顯示所有商品
 2. 顯示價格高於 NT$10000 的商品
 3. 顯示價格低於 NT$9999 的商品

 */

$("#SelectPrice li:nth-of-type(1)").click(function(event) {
    firebase.database().ref("Items").once("value", reProduceAll);
});

$("#SelectPrice li:nth-child(2)").click(function(event) {
    firebase.database().ref("Items").orderByChild("price").startAt(10000).once("value", reProduceAll); //排序資料，並抓取10000以上
});

$("#SelectPrice li:nth-of-type(3)").click(function(event) {
    firebase.database().ref("Items").orderByChild("price").endAt(9999).once("value", reProduceAll); //排序資料，並抓取9999以下
});

function viewAllItems() {
    firebase.database().ref("Items").once("value", reProduceAll);
}
// -------------------------view--------------------------------

firebase.database().ref("Items/").on("value", reProduceAll);

function reProduceAll(allItems) {
    var allData = allItems.val();
    $("#items").empty();
    for (var itemData in allData) {
        allData[itemData].itemKey = itemData;
        produceSingleItem(allData[itemData]);
    }
}

function produceSingleItem(sinItemData) {
    /*
      抓取 sinItemData 節點上的資料。
      若你的sinItemData資料欄位中並沒有使用者名稱，請再到user節點存取使用者名稱
      資料齊全後塞進item中，創建 Item 物件，並顯示到頁面上。
    */
    var item = sinItemData;
    var User = firebase.auth().currentUser;
    var thisitem = item;
    var product = new Item({
        "title": thisitem.title,
        "price": thisitem.price,
        "itemKey": sinItemData.itemKey,
        "seller": thisitem.seller,
        "sellerName": thisitem.sellerName
    }, currentUser);
    $("#items").append(product.dom);
    /*
      用 ViewModal 填入這筆 item 的資料
      呼叫 ViewModal callImage打開圖片
      創建一個 MessageBox 物件，將 Message 的結構顯示上 #message 裡。
      */

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
        var messBox = new MessageBox(firebase.auth().currentUser, sinItemData.itemKey);
        $("#message").append(messBox.dom);
        generateDialog(sinItemData.itemKey, messBox);
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
                        //firebase.database.ref("Items").off();
                        newmessage.push(message);
                        viewModal.callImage(sinItemData.itemKey, thisitem.seller);

                    });

                    $(this).find("#dialog").val("");

                }
            });
        } //end if currenUser

    });
    /*
    從資料庫中抓出message資料，並將資料填入MessageBox
    */


    // });

    /*
    如果使用者有登入，替 editBtn 監聽事件，當使用者點選編輯按鈕時，將資料顯示上 uploadModal。
    */


}
//new Date().getTime()
function generateDialog(diaDatakey, messageBox) {

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


function reProduceAll(allItems) {
    var allData = allItems.val();
    /*
     清空頁面上 (#item)內容上的東西。
     讀取爬回來的每一個商品
     */
    $("#items").empty();
    /*
     利用for in存取
     */
    for (var item in allData) {
        allData[itemData].itemKey = itemData;
        produceSingleItem(item);
    }
}
// 每點開一次就註冊一次
function produceSingleItem(sinItemData) {
    /*
     抓取 sinItemData 節點上的資料。
     若你的sinItemData資料欄位中並沒有使用者名稱，請再到user節點存取使用者名稱
     資料齊全後塞進item中，創建 Item 物件，並顯示到頁面上。
     */

    firebase.database().ref().once("", function() {
        $("#items").append();

        /*
         用 ViewModal 填入這筆 item 的資料
         呼叫 ViewModal callImage打開圖片
         創建一個 MessageBox 物件，將 Message 的結構顯示上 #message 裡。
         */


        $("#message").append();

        /*
         判斷使用者是否有登入，如果有登入就讓 #message 容器顯示輸入框。
         在 MessageBox 上面註冊事件，當 submit 時將資料上傳。
         */
        if (currentUser) {
            $("#message").append(messBox.inputBox);

            messBox.inputBox.keypress(function(e) {
                if (e.which == 13) {
                    e.preventDefault();

                    /*
                     取得input的內容 $(this).find("#dialog").val();
                     清空input的內容 $(this).find("#dialog").val("");
                     */
                }
            });
        }

        /*
         從資料庫中抓出message資料，並將資料填入MessageBox
         */
        firebase.database().ref().orderBy("", function(data) {

        });
    });

    /*
     如果使用者有登入，替 editBtn 監聽事件，當使用者點選編輯按鈕時，將資料顯示上 uploadModal。
     */

}

function generateDialog(diaData, messageBox) {


}
