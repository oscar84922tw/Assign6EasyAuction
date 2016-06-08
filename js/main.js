// Initialize Firebase
var config = {
    apiKey: "AIzaSyBf43dSNHvQRZZIufoOiMi_h5Gm-lRtFfE",
    authDomain: "project-7278713962723204241.firebaseapp.com",
    databaseURL: "https://project-7278713962723204241.firebaseio.com",
    storageBucket: "project-7278713962723204241.appspot.com",
};
firebase.initializeApp(config);
ImageDealer.REF = firebase;
var currentUser;

var fbProvider = new firebase.auth.FacebookAuthProvider();
/*
 分為三種使用情形：
 1. 初次登入，改變成登入狀態
 2. 已為登入狀態，reload 網站照樣顯示登入狀態
 3. 未登入狀態

 登入/當初狀態顯示可使用下方 logginOption function
 */

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        logginOption(true);
    } else {
        logginOption(false);
    }
});

$("#signin").click(function () {
    firebase.auth().signInWithPopup(fbProvider).then(function (result) {
        console.log(result);
        logginOption(true);
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessa = error.message;
        console.log(errorCode, errorMessa);
    })
});

$("#signout").click(function () {
    firebase.auth().signOut().then(function () {
        logginOption(false);
    }, function (error) {
        console.log(error.code);
    });
});

$("#submitData").click(function () {
    var currentUser = firebase.auth().currentUser;
    var product = new Item({
      title: $("#itemName").val(),
      price: $("#price").val(),
      Description: $("#descip").val(),
      itemKey: "-sdfjiotfdgjl",
      seller: "sdfjigalngme",
      sellerName: "Radia"
    }, currentUser);
    firebase.database().ref("items").push(data);
    $("item-info").append(product.dom);
});

$("#editData").click(function () {
    // 編輯商品資訊
})

$("#removeData").click(function () {
    //刪除商品
})

$(".picBox").click(function () {
    var viewModal = new ViewModal($(".picBox"));
    var uploadModal = new UploadModal($(".picBox"));
    uploadModal.submitPic(firebase.auth().currentUser.uid);
})
/*
 商品按鈕在dropdown-menu中
 三種商品篩選方式：
 1. 顯示所有商品
 2. 顯示價格高於 NT$10000 的商品
 3. 顯示價格低於 NT$9999 的商品

 */


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
    /*
     清空頁面上 (#item)內容上的東西。
     讀取爬回來的每一個商品
     */

    /*
     利用for in存取
     */
      for (var item in allItems ) {
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

    firebase.database().ref().once("", function () {
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

            messBox.inputBox.keypress(function (e) {
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
          firebase.database().ref().orderBy.("", function(data) {
            
          });
        });

        /*
         如果使用者有登入，替 editBtn 監聽事件，當使用者點選編輯按鈕時，將資料顯示上 uploadModal。
         */

    })
}

function generateDialog(diaData, messageBox) {


}
