var app = ons.bootstrap();
var db;
var devfest_service = {
        loadData: function() {
                $.getJSON('https://devfest2015.gdgnantes.com/assets/prog.json', function(data) {
                    var strValue = JSON.stringify(data);
                    localStorage.setItem("DEV_FEST_PROG", strValue);
                });
            },
            getData: function(callback) {
                var strValue = localStorage.getItem("DEV_FEST_PROG");
                callback(JSON.parse(strValue));
            }   
    };
devfest_service.loadData();

$(document).on('pageinit', '#homePage', function() {   
});

/*
    Initialisation de la page "Sessions"
*/
$(document).on('pageinit', "#sessionsPage", function() {
    devfest_service.getData(function(data) {
        for (var category in data.categories) {      
            $("#sessionList").append("<li class='list__header'>" + data.categories[category] + "</li>");
            data.sessions.forEach(function(session) {
                if (session.type === category) {  
                    $("#sessionList").append("<ons-list-item class='list__item list__item--chevron' id='session_" + session.id + "'>" + session.title + "</ons-list-item>");
                    $("#session_" + session.id).on('click', function(event) {
                      app.navi.pushPage('views/session.html', {session : session});
                  	});
                }
            });
        }
    });
});

$(document).on('pageinit', "#sessionItemPage", function() {
    var session = app.navi.getCurrentPage().options.session;
    if(window.sqlitePlugin != undefined){
        db = window.sqlitePlugin.openDatabase({name: "my.db"});
        db.transaction(function(tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS NOTES (id integer primary key, comment text DEFAULT "", sessionId text, fav text DEFAULT "false")');
            tx.executeSql('SELECT fav FROM NOTES WHERE sessionId = ? ;', [session.id], function(tx, res) {
                console.log(res.rows.item(0));
                if (res.rows.item(0) && res.rows.item(0).fav == "true") {
                    $("#favorite").append('<ons-icon icon="fa-star" size="30px" class="ons-icon fa-star fa" style="font-size: 30px;" onclick=\'unfav("' + session.id + '")\'></ons-icon>');
                }else{
                    $("#favorite").append('<ons-icon icon="fa-star-o" size="30px" class="ons-icon fa-star-o fa" style="font-size: 30px;" onclick=\'fav("' + session.id + '")\'></ons-icon>');
                }
            });
        });
    }
	$("#sessionItemTitle").append(session.title);
	$("#sessionItemConfRoom").append("Salle : " + session.confRoom);
	$("#sessionItemSpeaker").append("@" + session.speakers);
	$("#sessionItemDesc").append(session.desc);
    $("#sessionNotesButton").on('click', function(event) {
        app.navi.pushPage('views/notes.html', {session : session});
    });
});

function fav(sessionId){
    $("#favorite").empty();
    $("#favorite").append('<ons-icon icon="fa-star" size="30px" class="ons-icon fa-star fa" style="font-size: 30px;" onclick=\'unfav("' + sessionId + '")\'></ons-icon>');
    saveFav(sessionId, "true");
}

function unfav(sessionId){
    $("#favorite").empty();
    $("#favorite").append('<ons-icon icon="fa-star-o" size="30px" class="ons-icon fa-star-o fa" style="font-size: 30px;" onclick=\'fav("' + sessionId + '")\'></ons-icon>');
    saveFav(sessionId, "false");
}

function saveFav(sessionId, fav){
    db.transaction(function(tx) {
        var todo = "INSERT";
        tx.executeSql('SELECT * FROM NOTES WHERE sessionId=? ;', [sessionId], function(tx, res) {
            if (res.rows.item(0)) {
                todo = "UPDATE";
            }
            if (todo == "INSERT") {
                tx.executeSql('INSERT INTO NOTES (fav, sessionId) VALUES (?,?)', [fav, sessionId], function(tx, res) {
                    tx.executeSql('SELECT * FROM NOTES WHERE sessionId=? ;', [sessionId], function(tx, res) {
                        console.log(res.rows.item(0));
                    });
                });
            } else if (todo == "UPDATE") {
                tx.executeSql('UPDATE NOTES SET fav=? WHERE sessionId=?', [fav, sessionId], function(tx, res) {
                    tx.executeSql('SELECT * FROM NOTES WHERE sessionId=? ;', [sessionId], function(tx, res) {
                        console.log(res.rows.item(0));
                    });
                });
            }
        });
    }, function(error) {
        console.log('transaction error: ' + error.message);
    }, function() {
        console.log('transaction ok');
    });
}

$(document).on('pageinit', "#sessionItemNotesPage", function() {
    var session = app.navi.getCurrentPage().options.session;
    $("#sessionItemTitleNotesPage").append(session.title);    
    db = window.sqlitePlugin.openDatabase({name: "my.db"});
    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM NOTES WHERE sessionId = ? ;', [session.id], function(tx, res) {
            if (res.rows.item(0)) {
                $('textarea#sessionMesNotesTextArea').val(res.rows.item(0).comment);
            }
        });
        tx.executeSql('CREATE TABLE IF NOT EXISTS IMAGES (id integer primary key, sessionId text, encodedDataURL text)');
        tx.executeSql('SELECT encodedDataURL FROM IMAGES WHERE sessionId = ? ;', [session.id], function(tx, res) {
            if (res.rows.item(0)) {
                $("#images").append('<img src="data:image/jpeg;base64,' + res.rows.item(0).encodedDataURL + '" width="80%"/>');
                console.log(res.rows.item(0));
            }
        });
    });

    $("#sessionButtonSaveNotes").on('click', function(event) {
        var notes = $('textarea#sessionMesNotesTextArea').val();
        console.log(notes);
        db.transaction(function(tx) {
            var todo = "INSERT";
            tx.executeSql('SELECT * FROM NOTES WHERE sessionId=? ;', [session.id], function(tx, res) {
                if (res.rows.item(0)) {
                    todo = "UPDATE";
                }
                 console.log(todo);
                if (todo == "INSERT") {
                    tx.executeSql('INSERT INTO NOTES (comment, sessionId) VALUES (?,?)', [notes, session.id], function(tx, res) {
                        tx.executeSql('SELECT * FROM NOTES WHERE sessionId=? ;', [session.id], function(tx, res) {
                            console.log(res.rows.item(0));
                        });
                    });
                } else if (todo == "UPDATE") {
                    tx.executeSql('UPDATE NOTES SET comment=? WHERE sessionId=?', [notes, session.id], function(tx, res) {
                        tx.executeSql('SELECT * FROM NOTES WHERE sessionId=? ;', [session.id], function(tx, res) {
                            console.log(res.rows.item(0));
                        });
                    });
                }
            });
        }, function(error) {
            console.log('transaction error: ' + error.message);
        }, function() {
            console.log('transaction ok');
        });
        
    });
    
    function imageLoaded(imageData) { 
        $("#images").append('<img src="data:image/jpeg;base64,' + imageData + '" width="80%"/>');
        // Saving image
        db.transaction(function(tx) {
            tx.executeSql('INSERT INTO IMAGES (sessionId, encodedDataURL) VALUES (?,?)', [session.id, imageData], function(tx, res) {
                tx.executeSql('SELECT * FROM IMAGES WHERE sessionId=? ;', [session.id], function(tx, res) {
                    console.log(res.rows.item(0));
                });
            });
        }, function(error) {
            console.log('transaction error: ' + error.message);
        }, function() {
            console.log('transaction ok');
        });
    }
    function onFail(message) { }
    
    $("#pickImageFile").on('click', function(event) {
        
        navigator.camera.getPicture(imageLoaded,onFail,{
            quality: 50,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY});
    });
    
    $("#takePicture").on('click', function(event) {
        
        navigator.camera.getPicture(imageLoaded,onFail,{
            quality: 50,
            destinationType: Camera.DestinationType.DATA_URL});
    });

});

$(document).on('pagehide', '#sessionItemNotesPage', function() {
    db.close(function() {
        console.log('database is closed ok');
    }, function(error) {
        console.log('ERROR closing database');
    });
});

$(document).on('pageinit', "#speakersPage", function() {
    devfest_service.getData(function(data) {
		data.speakers.sort(function(a,b){
               return a.firstname > b.firstname?1:-1;
         });
        data.speakers.forEach(function(speaker) {
            var about = speaker.about;
            if (about.length > 150)
                about = about.substring(0, 150) + "...";
            var domString =
                    "<ons-list-item id='speaker_" + speaker.id + "' modifier='chevron' class='list-item-container'>" + 
                    "  <div class='list-item-left'>" + 
                    "    <img src='data/images/" + speaker.image + "' class='avator'>" +
                    "  </div>" +
                    "  <div class='list-item-right'>" +
                    "    <div class='list-item-content'>" +
                    "      <div class='name'>" + speaker.firstname + " " + speaker.lastname + 
                    "        <span class='lucent'>@ " + speaker.id + "</span>" +
                    "      </div>" +
                    "      <span class='desc'>" + about + "</span>" +
                    "    </div>" +
                    "  </div>" +
                    "</ons-list-item>";
            
            $("#speakersList").append(domString);
            $("#speaker_" + speaker.id).on('click', function(event) {
              app.navi.pushPage('views/speaker.html', {speaker : speaker});
          	});
        });
        ons.compile(document.getElementById("speakersList")); 
    });
});

$(document).on('change', '#switchContact', function() {
    var speaker = app.navi.getCurrentPage().options.speaker;
    if ($('#switchContact').prop('checked')) {
        var contact = navigator.contacts.create();
        contact.displayName = speaker.firstname + " " + speaker.lastname;
        contact.nickname = speaker.id;
        contact.name = speaker.lastname;
        var urls = [];
        speaker.socials.forEach(function(social){
            var field = new ContactField();
            field.type = social.class;
            field.value = social.link;
            field.pref = false;
            urls.push(field);
        });
        contact.urls = urls;
        contact.note = speaker.desc;
        var organizations = [];
        var organization = new ContactOrganization();
        organization.type = "organization";
        organization.name = speaker.company;
        organization.pref = "false";
        organizations.push(organization);
        contact.organizations = organizations;

        var photos = [];
        var photo = new ContactField();
        photo.type = "image";
        photo.value = "data/images/" + speaker.image;
        photo.pref = true;
        photos.push(photo);
        contact.photos = photos;

        console.log(contact);

        contact.save(function(contact) {
            console.log("sauvegarde OK");
        }, function(contactError) {
            console.log("sauvegarde KO");
        });
    } else {
        var optionsRecherche = new ContactFindOptions();
        optionsRecherche.filter = speaker.id;
        optionsRecherche.desiredFields = [navigator.contacts.fieldType.nickname];
        var champsRecherche = [navigator.contacts.fieldType.nickname,
        navigator.contacts.fieldType.nickname];
        navigator.contacts.find(champsRecherche, function(contacts) {
            console.log("recherche contact OK");
            if (contacts.length > 0) {
                contacts[0].remove(function(contact) {
                    console.log("suppression contact OK");
                }, function(contactError) {                    
                    console.log("suppression contact KO");
                })
            }
        }, function(contactError) {
            console.log("recheche contact KO");
        }, optionsRecherche);
    }
 });

$(document).on('pageinit', "#speakerItemPage", function() {
	var speaker = app.navi.getCurrentPage().options.speaker;
	$("#speakerItemImage").attr("src", "data/images/" + speaker.image);
	$("#speakerItemName").append(speaker.firstname + " " + speaker.lastname);
	$("#speakerItemId").append("@" + speaker.id);
	$("#speakerItemAbout").append(speaker.about);
    var optionsRecherche = new ContactFindOptions();
        optionsRecherche.filter = speaker.id;
        optionsRecherche.desiredFields = [navigator.contacts.fieldType.nickname];
        var champsRecherche = [navigator.contacts.fieldType.nickname,
        navigator.contacts.fieldType.nickname];
        navigator.contacts.find(champsRecherche, function(contacts) {
            console.log("contact présent");
            if (contacts.length > 0) {
                $('#switchContact').prop('checked', true);
            }
        }, function(contactError) {
            console.log("contact pas présent");
            $('#switchContact').prop('checked', false);
        }, optionsRecherche);
});



$(document).on('pageinit', "#pageTechnique", function() {
	console.log(device);
	$('#deviceList').append("<li class='list__item'><span class='label'> Available : </span>" + device.available + "</li>");
	$('#deviceList').append("<li class='list__item'><span class='label'> Platform : </span>" + device.platform + "</li>");
	$('#deviceList').append("<li class='list__item'><span class='label'> Version : </span>" + device.version + "</li>");
	$('#deviceList').append("<li class='list__item'><span class='label'> Uuid : </span>" + device.uuid + "</li>");
	$('#deviceList').append("<li class='list__item'><span class='label'> Cordova : </span>" + device.cordova + "</li>");
	$('#deviceList').append("<li class='list__item'><span class='label'> Model : </span>" + device.model + "</li>");
	$('#deviceList').append("<li class='list__item'><span class='label'> Manufacturer : </span>" + device.manufacturer + "</li>");
	$('#deviceList').append("<li class='list__item'><span class='label'> Connexion : </span>" + navigator.connection.type + "</li>");
});
