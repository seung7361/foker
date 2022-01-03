const socket = io.connect(window.location.host);
const myname = decodeURIComponent( window.location.search.split('=')[1] );
let room;
let myroom;
let seruser = [
    {name:'',call:0,money:100,card:[],onground:[],state:'normal'},
    {name:'',call:0,money:100,card:[],onground:[],state:'normal'},
    {name:'',call:0,money:100,card:[],onground:[],state:'normal'},
    {name:'',call:0,money:100,card:[],onground:[],state:'normal'}
];
let isPublic = true;

socket.emit('init', myname);
socket.emit('req-roomlist', null);
socket.on('res-roomlist', function (data) {
    room = data;
    drawroomlist();
});

socket.on('illegal_statement', function (data) {
    alert('an illegal statement.');
    window.location.pathname = '/';
});

function drawroomlist() {
    let innerhtml = new String();
    for (let i = 0; i < room.length; i++) {
        if (room[i].users >= 4) {
            // not available
            innerhtml += `
            <div class="roomlist w-clearfix" id="${room[i].id}">
                <p class="paragraph">${room[i].name}</p>
                <div class="div-block-3 notavailable">
                <p class="paragraph-2">${room[i].users}/4</p>
                </div>
            </div>
            `;

        } else {
            // available
            innerhtml += `
            <div class="roomlist w-clearfix" id="${room[i].id}">
                <p class="paragraph">${room[i].name}</p>
                <div class="div-block-3">
                <p class="paragraph-2">${room[i].users}/4</p>
                </div>
            </div>
            `;
        }
    }

    document.getElementById('tab-findroom').innerHTML = innerhtml;

    Array.from(document.getElementsByClassName('roomlist')).forEach(function (element) {
        element.addEventListener('click', function (event) {
            let password = prompt('비밀번호를 입력해주세요. (비번이 없다면 빈칸으로 남겨주세요.)').trim();
            socket.emit('req-roomjoin', element.id, password);
        });
    });
}

document.getElementById('return').addEventListener('click', function (event) {
    window.location.pathname = '/';
});

document.getElementById('public').addEventListener('click', function (event) {
    isPublic = true;
    if (!document.getElementById('public').classList.contains('checked')) {
        document.getElementById('public').classList.add('checked');
    }
    if (document.getElementById('notpublic').classList.contains('checked')) {
        document.getElementById('notpublic').classList.remove('checked');
    }
    if (!document.getElementById('roompassword').classList.contains('none')) {
        document.getElementById('roompassword').classList.add('none');
    }
});

document.getElementById('notpublic').addEventListener('click', function (event) {
    isPublic = false;
    if (document.getElementById('public').classList.contains('checked')) {
        document.getElementById('public').classList.remove('checked');
    }
    if (!document.getElementById('notpublic').classList.contains('checked')) {
        document.getElementById('notpublic').classList.add('checked');
    }
    if (document.getElementById('roompassword').classList.contains('none')) {
        document.getElementById('roompassword').classList.remove('none');
    }
});

document.getElementById('makeroombutton').addEventListener('click', function (event) {
    if (document.getElementById('passwordinput').value != document.getElementById('passwordinputagain').value) {
        alert('비밀번호가 서로 일치하지 않습니다.');
        return 0;
    }

    rname = document.getElementById('roomnameinput').value
    if (rname == '') {
        rname = `${myname}의 방`;
    }
    socket.emit('req-makeroom', {
        name: rname,
        password: document.getElementById('passwordinput').value,
        isPublic: isPublic
    });
});

socket.on('res-makeroom', function (data, data1) {
    if (data == 1) {
        alert('an illegal statement; 방을 너무 많이 만들었습니다!');
        return 0;
    }

    socket.emit('req-roomjoin', data, data1);
});

socket.on('res-roomjoin', function (data, state) {
    if (state == 1) {
        
        if (data.error == 'passworderror') {
            alert('비밀번호가 틀렸습니다.');
            return 0;
        }

        else if (data.error == 'nosuchroom') {
            alert('그 방은 존재하지 않습니다.');
            return 0;
        }

    }

    myroom = data;
    gotoroomscreen();
    updateroominfo();
    updatechatinfo();
});

socket.on('res-updateroominfo', function (data) {
    myroom = data;
    updateroominfo();
    updatechatinfo();
});

function gotoroomscreen() {
    if ( document.getElementById('tab1').classList.contains('w--current') ) {
        document.getElementById('tab1').classList.remove('w--current');
    }
    document.getElementById('tab1').classList.add('none');
    if ( document.getElementById('tab2').classList.contains('w--current') ) {
        document.getElementById('tab2').classList.remove('w--current');
    }
    document.getElementById('tab2').classList.add('none');

    document.getElementById('hidden').classList.remove('none');
    document.getElementById('hidden').classList.add('w--current');
    document.getElementById('hidden').click();
}

function updateroominfo() {
    document.getElementById('roomname').innerText = `${myroom.name}(${myroom.id})`;

    let innerhtml = '';
    for (let i = 0; i < myroom.users.length; i++) {

        if (myroom.users[i].ready) {
            innerhtml += `
            <div class="div-block-10">
                <p class="paragraph-4">${myroom.users[i].name}</p>
                <div class="div-block-3"><p class="paragraph-3">READY</p></div>
            </div>
            `;
        } else {
            innerhtml += `
            <div class="div-block-10">
                <p class="paragraph-4">${myroom.users[i].name}</p>
                <div class="div-block-3 notavailable"><p class="paragraph-3">NOT READY</p></div>
            </div>
            `;
        }
        if (i == 0) {
            innerhtml += `
            <div class="div-block-10">
                <div class="div-block-3"><p class="paragraph-3">${myroom.users.length}/4</p></div>
            </div>
            `
        }
    }
    innerhtml += `
    <div class="div-block-10">
        <div class="div-block-5 readybutton"><p onclick="ready()" class="paragraph-5">READY</p></div>
    </div>
    `;
    document.getElementById('roomgrid').innerHTML = innerhtml;
}

function ready() {
    socket.emit('req-ready', 0);
}

document.getElementById('chat').addEventListener('keyup', function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        if (document.getElementById('chat').value.trim() == '') return 0;
        if (document.getElementById('chat').value.includes('#') || document.getElementById('chat').value.includes('^')) {
            document.getElementById('chat').value = '';
            return 0;
        }
        socket.emit('req-message', document.getElementById('chat').value.trim());
        document.getElementById('chat').value = '';
    }
});

document.getElementById('roombylink').addEventListener('click', function (event) {
    let link = prompt('참가하실 방의 링크를 입력해주세요.');
    if (link == null || link == '') {
        return 0;
    }
    let pswrd = prompt('그 방의 비번을 입력해주세요. (비번이 없다면 빈칸으로 둬 주세요.)');
    socket.emit('req-roomjoin', link, pswrd);
});

function updatechatinfo() {
    chats = myroom.chat.split('^^^');
    let innerhtml = '';
    if (chats.length <= 1) return 0;

    for (let i = 0; i < chats.length-1; i++) {
        innerhtml += `${chats[i].split('###')[0]}: ${chats[i].split('###')[1]} <br>`;
    }
    document.getElementById('chathtml').innerHTML = innerhtml;
    document.getElementById('chathtml').scrollTop = document.getElementById('chathtml').scrollHeight;
    document.getElementById('ingamechatlist').innerHTML = innerhtml;
    document.getElementById('ingamechatlist').scrollTop = document.getElementById('ingamechatlist').scrollHeight;
}

socket.on('res-gamestart', function (data) {
    seruser = new Array();
    let idx;
    for (let i = 0; i < myroom.users.length; i++) {
        if (myroom.users[i].id == socket.id) {
            idx = i;
            seruser.push(myroom.users[i]);
            seruser[0].card = [];
            seruser[0].onground = [];
        }
    }

    for (let i = 0; i < myroom.users.length; i++) {
        if (i != idx) {
            seruser.push(myroom.users[i]);
        }
    }

    for (let i = 0; i < seruser.length-1; i++) {
        seruser[i+1].card = ['back', 'back', 'back', 'back'];
        seruser[i+1].onground = [];
    }

    socket.emit('req-mycardinit', null);

    document.getElementById('wrapper').style.display = 'none';
    document.getElementById('ingamestats').style.display = 'block';
    document.getElementById('defaultCanvas0').style.display = 'block';
    loop();
});

socket.on('res-mycardinit', function (data) {
    seruser[0].card = data;
});


document.getElementById('ingamechatinput').addEventListener('keyup', function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        if (document.getElementById('ingamechatinput').value.trim() == '') return 0;
        if (document.getElementById('ingamechatinput').value.includes('#') || document.getElementById('ingamechatinput').value.includes('^')) {
            document.getElementById('ingamechatinput').value = '';
            return 0;
        }
        socket.emit('req-message', document.getElementById('ingamechatinput').value.trim());
        document.getElementById('ingamechatinput').value = '';
    }
});

let cardimage = new Array();
let cardback;
function preload() {
    cardback = loadImage(`src/back.png`);
    // cardback = loadImage(`src/test.png`);
    for (let i = 1; i <= 13; i++) {
        cardimage[i] = new Array();
        for (let j = 1; j <= 4; j++) {
            cardimage[i][j] = loadImage(`src/${ numberToJob(i) }_of_${ numberToPattern(j) }.png`);
        }
    }
}

function numberToJob(n) {
    if (n == 1) return 'ace';
    else if (n == 11) return 'jack';
    else if (n == 12) return 'queen';
    else if (n == 13) return 'king';
    else if (n == 14) return 'ace';
    else return n;
}

function numberToPattern(n) {
    if (n == 4) return 'spades';
    else if (n == 3) return 'diamonds';
    else if (n == 2) return 'hearts';
    else if (n == 1) return 'clubs';
}

function setup() {
    let cnv = createCanvas(windowWidth - 250, windowHeight);
    cnv.position(250, 0);
    noLoop();
}

function windowResized() {
    resizeCanvas(windowWidth - 250, windowHeight);
}

function draw() {
    clear();
    background('#2c7643');
    translate(width/2, height/2);
    drawinit();
}

function displayCard(name, x, y, w, h) {
    if (name == 'joker') {
        image(jokercard, x, y, w, h);
        return 0;
    }

    if (name == 'back') {
        image(cardback, x, y, w, h);
        return 0;
    }

    let isSelected;
    if (selected == name) isSelected = true;

    name = name.split('_');
    if (name[0] == 'A') name[0] = 1;
    else if (name[0] == 'JACK') name[0] = 11;
    else if (name[0] == 'QUEEN') name[0] = 12;
    else if (name[0] == 'KING') name[0] = 13;

    if (name[1] == 'SPADE') name[1] = 4;
    else if (name[1] == 'DIAMOND') name[1] = 3;
    else if (name[1] == 'HEART') name[1] = 2;
    else if (name[1] == 'CLOVER') name[1] = 1;

    if (isSelected) {
        image(cardimage[name[0]][name[1]], x, y-20, w, h);
    } else {
        image(cardimage[name[0]][name[1]], x, y, w, h);
    }
}

function drawinit() {

    // card stack in the middle
    imageMode(CENTER);
    for (let i = 0; i < 10; i++) {
        image(cardback, -27+3*i, 27-3*i, 100, 145);
    }

    // my cards holding
    imageMode(CENTER);
    if (seruser[0].card.length == 1) {
        displayCard(seruser[0].card[0], 0, height / 2 - 100, 100, 145);
    } else if (seruser[0].card.length % 2 == 0) {
        // even number
        for (let i = 0; i < seruser[0].card.length; i++) {
            displayCard(seruser[0].card[i], -110 * (seruser[0].card.length / 2 - 1) - 55 + 110 * i, height / 2 - 100, 100, 145);
        }
    } else {
        // odd number but not 1
        for (let i = 0; i < seruser[0].card.length; i++) {
            displayCard(seruser[0].card[i], -110 * ((seruser[0].card.length - 1) / 2) + 110 * i, height / 2 - 100, 100, 145);
        }
    }

    // my cards on ground
    if (seruser[0].onground.length == 1) {
        displayCard(seruser[0].onground[0], 0, height / 2 - 250, 100, 145);
    } else if (seruser[0].onground.length % 2 == 0) {
        for (let i = 0; i < seruser[0].onground.length; i++) {
            displayCard(seruser[0].onground[i], -110 * (seruser[0].onground.length / 2 - 1) - 55 + 110 * i, height / 2 - 250, 100, 145);
        }
    } else {
        for (let i = 0; i < seruser[0].onground.length; i++) {
            displayCard(seruser[0].onground[i], -110 * ((seruser[0].onground.length - 1) / 2) + 110 * i, height / 2 - 250, 100, 145);
        }
    }

    // user panel
    // me
    colorMode(RGB);
    rectMode(CENTER);
    if (seruser[0].focused) {
        fill('rgba(249, 124, 124, 0.7)');
    } else if (seruser[0].state == 'die') {
        fill('rgba(31, 31, 31, 0.7)');
    } else {
        fill('rgba(120, 162, 204, 0.7)');
    }
    rect(0, height / 2 - 100, 200, 70, 20);
    textSize(15);
    textAlign(CENTER);
    fill('rgb(255, 255, 255)');
    textFont('Noto Sans KR');
    text(seruser[0].name, 0, height / 2 - 105);
    text(`$${seruser[0].call} / $${seruser[0].money}`, 0, height / 2 - 85);
    
    

    // user 1
    angleMode(DEGREES);
    rotate(90);
    
    
    imageMode(CENTER);
    if (seruser[1].card.length == 1) {
        displayCard(seruser[1].card[1], 0, height / 2 - 100, 100, 145);
    } else if (seruser[1].card % 2 == 0) {
        // even number
        for (let i = 0; i < seruser[1].card.length; i++) {
            displayCard(seruser[1].card[i], -110 * (seruser[1].card.length / 2 - 1) - 55 + 110 * i, height / 2 - 100, 100, 145);
        }
    } else {
        // odd number but not 1
        for (let i = 0; i < seruser[1].card.length; i++) {
            displayCard(seruser[1].card[i], -110 * ((seruser[1].card.length - 1) / 2) + 110 * i, height / 2 - 100, 100, 145);
        }
    }

    if (seruser[1].onground.length == 1) {
        displayCard(seruser[1].onground[0], 0, height / 2 - 250, 100, 145);
    } else if (seruser[1].onground.length % 2 == 0) {
        for (let i = 0; i < seruser[1].onground.length; i++) {
            displayCard(seruser[1].onground[i], -110 * (seruser[1].onground.length / 2 - 1) - 55 + 110 * i, height / 2 - 250, 100, 145);
        }
    } else {
        for (let i = 0; i < seruser[1].onground.length; i++) {
            displayCard(seruser[1].onground[i], -110 * ((seruser[1].onground.length - 1) / 2) + 110 * i, height / 2 - 250, 100, 145);
        }
    }

    rectMode(CENTER);
    if (seruser[1].focused) {
        fill('rgba(249, 124, 124, 0.7)');
    } else if (seruser[1].state == 'die') {
        fill('rgba(31, 31, 31, 0.7)');
    } else {
        fill('rgba(120, 162, 204, 0.7)');
    }
    rect(0, height / 2 + 50, 200, 60, 20);
    textSize(15);
    fill('rgb(255, 255, 255)');
    textFont('Noto Sans KR');
    text(`${seruser[1].name}`, 0, height / 2 + 65);
    text( `$${seruser[1].call} / $${seruser[1].money}`, 0, height/2 + 45 );

    // user 2
    angleMode(DEGREES);
    rotate(90);

    
    imageMode(CENTER);
    if (seruser[2].card.length == 1) {
        displayCard(seruser[2].card[0], 0, height / 2 - 100, 100, 145);
    } else if (seruser[2].card % 2 == 0) {
        // even number
        for (let i = 0; i < seruser[2].card.length; i++) {
            displayCard(seruser[2].card[i], -110 * (seruser[2].card.length / 2 - 1) - 55 + 110 * i, height / 2 - 100, 100, 145);
        }
    } else {
        // odd number but not 1
        for (let i = 0; i < seruser[2].card.length; i++) {
            displayCard(seruser[2].card[i], -110 * ((seruser[2].card.length - 1) / 2) + 110 * i, height / 2 - 100, 100, 145);
        }
    }

    if (seruser[2].onground.length == 1) {
        displayCard(seruser[2].onground[0], 0, height / 2 - 250, 100, 145);
    } else if (seruser[2].onground.length % 2 == 0) {
        for (let i = 0; i < seruser[2].onground.length; i++) {
            displayCard(seruser[2].onground[i], -110 * (seruser[2].onground.length / 2 - 1) - 55 + 110 * i, height / 2 - 250, 100, 145);
        }
    } else {
        for (let i = 0; i < seruser[2].onground.length; i++) {
            displayCard(seruser[2].onground[i], -110 * ((seruser[2].onground.length - 1) / 2) + 110 * i, height / 2 - 250, 100, 145);
        }
    }

    rectMode(CENTER);
    if (seruser[2].focused) {
        fill('rgba(249, 124, 124, 0.7)');
    } else if (seruser[2].state == 'die') {
        fill('rgba(31, 31, 31, 0.7)');
    } else {
        fill('rgba(120, 162, 204, 0.7)');
    }
    rect(0, height / 2 - 100, 200, 70, 20);
    textSize(15);
    textAlign(CENTER);
    fill('rgb(255, 255, 255)');
    textFont('Noto Sans KR');
    text(`${seruser[2].name}`, 0, height / 2 - 105);
    text(`$${seruser[2].call} / $${seruser[2].money}`, 0, height / 2 - 85);

    // user 3
    angleMode(DEGREES);
    rotate(90);

    
    imageMode(CENTER);
    if (seruser[3].card.length == 1) {
        displayCard(seruser[3].card[0], 0, height / 2 - 100, 100, 145);
    } else if (seruser[3].card % 2 == 0) {
        // even number
        for (let i = 0; i < seruser[3].card.length; i++) {
            displayCard(seruser[3].card[i], -110 * (seruser[3].card.length / 2 - 1) - 55 + 110 * i, height / 2 - 100, 100, 145);
        }
    } else {
        // odd number but not 1
        for (let i = 0; i < seruser[3].card.length; i++) {
            displayCard(seruser[3].card[i], -110 * ((seruser[3].card.length - 1) / 2) + 110 * i, height / 2 - 100, 100, 145);
        }
    }

    if (seruser[3].onground.length == 1) {
        displayCard(seruser[3].onground[0], 0, height / 2 - 250, 100, 145);
    } else if (seruser[3].onground.length % 2 == 0) {
        for (let i = 0; i < seruser[3].onground.length; i++) {
            displayCard(seruser[3].onground[i], -110 * (seruser[3].onground.length / 2 - 1) - 55 + 110 * i, height / 2 - 250, 100, 145);
        }
    } else {
        for (let i = 0; i < seruser[3].onground.length; i++) {
            displayCard(seruser[3].onground[i], -110 * ((seruser[3].onground.length - 1) / 2) + 110 * i, height / 2 - 250, 100, 145);
        }
    }

    rectMode(CENTER);
    if (seruser[3].focused) {
        fill('rgba(249, 124, 124, 0.7)');
    } else if (seruser[3].state == 'die') {
        fill('rgba(31, 31, 31, 0.7)');
    } else {
        fill('rgba(120, 162, 204, 0.7)');
    }
    rect(0, height / 2 + 50, 200, 60, 20);
    textSize(15);
    fill('rgb(255, 255, 255)');
    textFont('Noto Sans KR');
    text(`${seruser[3].name}`, 0, height / 2 + 65);
    text(`$${seruser[3].call} / $${seruser[3].money}`, 0, height / 2 + 45);


    
}

let state = '';
let selected = '';
socket.on('turn2', function (data) {
    state = 'turn2';
});

function mousePressed() {
    realmouseX = mouseX - width/2;
    realmouseY = mouseY - height/2;
    // card length = 1
    if (seruser[0].card.length == 1) {
        if (-50 < realmouseX && realmouseX < 50 && height / 2 - 100 - 72.5 < realmouseY && realmouseY < height / 2 - 100 + 72.5 ) {
            if (selected != seruser[0].card[i] || selected == '') selected = seruser[0].card[0];
            else {
                cardClicked(seruser[0].card[0]);
            }
        }
        return 0;
    }

    if (seruser[0].card.length % 2 == 0) {

        for (let i = 0; i < seruser[0].card.length; i++) {
            if (-110 * (seruser[0].card.length / 2 - 1) - 55 + 110 * i - 50 < realmouseX && realmouseX < -110 * (seruser[0].card.length / 2 - 1) - 55 + 110 * i + 50 && height / 2 - 100 - 50 < realmouseY && realmouseY < height / 2 - 100 + 50) {
                console.log('a');
                if (selected != seruser[0].card[i] || selected == '') selected = seruser[0].card[i];
                else {
                    cardClicked(seruser[0].card[i]);
                }

                return 0;
            }
        }

    }

    if (seruser[0].card.length % 2 != 0) {
        for (let i = 0; i < seruser[0].card.length; i++) {
            if (-110 * ((seruser[0].card.length - 1) / 2) + 110 * i - 50 < realmouseX && realmouseX < -110 * ((seruser[0].card.length - 1) / 2) + 110 * i + 50 && height / 2 - 100 - 50 < realmouseY && realmouseY < height / 2 - 100 + 50) {
                if (selected != seruser[0].card[i] || selected == '') selected = seruser[0].card[i];
                else {cardClicked(seruser[0].card[i]);}

                return 0;
            }
        }
    }

    selected = '';

}

function cardClicked(card) {
    if (!seruser[0].focused) return 0;

    if (state == 'turn2') {
        socket.emit('req-turn2', card);
    } else if (state == 'turn3') {
        socket.emit('req-turn3', card);
    }
}

socket.on('res-turn2', function (data) {
    state = 'turn2end';
    seruser[0].card = data;
});

let abilityselect;

socket.on('res-jokercardselect', function (type, data) {

    if (type == 'id') {

        // do something with id

    } else if (type == 'ability') {

        abilityselect = data;
        makeabilityselection();

    }

});

function makeabilityselection() {
    console.table(abilityselect);

    // some click functions

    sendabilityselection(`  ??  /? ? ?/`);
}

function sendabilityselection(num) {
    socket.emit('req-jokercardselect', parseInt(num));
}

socket.on('res-updatecards', function (sessionid, towhat) {
    console.log('received', sessionid, towhat);
    for (let i = 0; i < seruser.length; i++) {
        console.log(seruser[i], sessionid, towhat);
        if (seruser[i].id == sessionid) {
            seruser[i].card = towhat;
            console.log(towhat, 'a');
        }
    }
});

socket.on('res-updatecall', function (sessionid, towhat) {
    console.log('received call', sessionid, towhat);
    if (sessionid == 'everyone') {
        for (let i = 0; i < seruser.length; i++) {
            seruser[i].call = towhat;
        }
        return 0;
    }

    for (let i = 0; i < seruser.length; i++) {
        if (seruser[i].id == sessionid) {
            seruser[i].call = towhat;
        }
    }
});

socket.on('res-updatemoney', function (sessionid, towhat) {
    console.log('received money', sessionid, towhat);
    for (let i = 0; i < seruser.length; i++) {
        if (seruser[i].id == sessionid) {
            seruser[i].money = towhat;
        }
    }
});

socket.on('res-updateroomcall', function (towhat) {
    console.log('received roomcall', towhat);
    myroom.call = towhat;
});

socket.on('res-updatestate', function (sessionid, towhat) {

    if (sessionid == 'everyone') {
        for (let i = 0; i < seruser.length; i++) {
            seruser[i].state = towhat;
        }
        return 0;
    }

    for (let i = 0; i < seruser.length; i++) {
        if (seruser[i].id == sessionid) {
            seruser[i].state = towhat;
        }
    }
});

socket.on('res-focused', function (sessionid, towhat) {
    if (sessionid == 'everyone') {
        for (let j = 0; j < seruser.length; j++) {
            seruser[j].focused = towhat;
        } return 0;
    }
    console.log(sessionid);
    for (let j = 0; j < seruser.length; j++) {
        if (seruser[j].id == sessionid) {
            console.log(seruser[j].focused);
            seruser[j].focused = towhat;
            console.log(seruser[j].focused);
        }
    }
});

socket.on('turn3', function (data) {
    state = 'turn3';
});

socket.on('res-updatecards-onground', function (sessionid, towhat) {
    for (let i = 0; i < seruser.length; i++) {
        if (seruser[i].id == sessionid) {
            seruser[i].onground = towhat;
        }
    }
});

socket.on('res-updatecards-addhiddencard', function (sessionid, towhat) {
    for (let i = 0; i < seruser.length; i++) {
        if (seruser[i].state != 'die') {
            seruser[i].onground.push('back');
        }
    }
});

socket.on('res-updatecards-hidden', function (sessionid, towhat) {
    for (let i = 0; i < seruser.length; i++) {
        if (seruser[i].id == sessionid) {
            for (let j = 0; j < seruser[i].onground.length; j++) {
                if (seruser[i].onground[j] == 'back') {
                    seruser[i].onground[j] = towhat;
                }
            }
        }
    }
});

socket.on('res-turn3', function (data) {

});

socket.on('res-turn4start', function () {

});

socket.on('res-turn4-3buttondecision', function (data) {
    if (data == 1) {
        state = `turn4first`;
    } else {
        state = 'turn4';
    }
});

socket.on('res-turn6-3buttondecision', function (data) {
    if (data == 1) {
        state = 'turn6first';
    } else {
        state = 'turn6';
    }
});

socket.on('res-turn8-3buttondecision', function (data) {
    if (data == 1) {
        state = 'turn8first';
    } else {
        state = 'turn8';
    }
});

socket.on('res-turn10-3buttondecision', function (data) {
    if (data == 1) {
        state = 'turn10first';
    } else {
        state = 'turn10';
    }
});

document.getElementById('die').addEventListener('click', function () {
    if (state == 'turn4' || state == 'turn4first') {
        socket.emit('turn4-die', null);
    }

    if (state == 'turn6' || state == 'turn6first') {
        socket.emit('turn6-die', null);
    }

    if (state == 'turn8' || state == 'turn8first') {
        socket.emit('turn8-die', null);
    }

    if (state == 'turn10' || state == 'turn10first') {
        socket.emit('turn10-die', null);
    }
});

document.getElementById('checkcall').addEventListener('click', function () {
    
    if (state == 'turn4first') {
        socket.emit(`turn4-callfirst`, null);
        state = 'turn4end';
    } else if (state == 'turn4') {
        socket.emit(`turn4-call`, null);
        state = 'turn4end';
    }

    if (state == 'turn6first') {
        socket.emit(`turn6-callfirst`, null);
        state = 'turn6end';
    } else if (state == 'turn6') {
        socket.emit(`turn6-call`, null);
        state = 'turn6end';
    }

    if (state == 'turn8first') {
        socket.emit(`turn8-callfirst`, null);
        state = 'turn8end';
    } else if (state == 'turn8') {
        socket.emit(`turn8-call`, null);
        state = 'turn8end';
    }

    if (state == 'turn10first') {
        socket.emit(`turn10-callfirst`, null);
        state = 'turn10end';
    } else if (state == 'turn10') {
        socket.emit(`turn10-call`, null);
        state = 'turn10end';
    }
});

document.getElementById('raise').addEventListener('click', function () {
    
    if (state == 'turn4first') {
        socket.emit('turn4-raisefirst', document.getElementById('myRange').value);
        state = 'turn4end';
    } else if (state == 'turn4') {
        socket.emit(`turn4-raise`, document.getElementById('myRange').value);
        state = 'turn4end';
    }

    if (state == 'turn6first') {
        socket.emit('turn6-raisefirst', document.getElementById('myRange').value);
        state = 'turn6end';
    } else if (state == 'turn6') {
        socket.emit(`turn6-raise`, document.getElementById('myRange').value);
        state = 'turn6end';
    }

    if (state == 'turn8first') {
        socket.emit('turn8-raisefirst', document.getElementById('myRange').value);
        state = 'turn8end';
    } else if (state == 'turn8') {
        socket.emit(`turn8-raise`, document.getElementById('myRange').value);
        state = 'turn8end';
    }

    if (state == 'turn10first') {
        socket.emit('turn10-raisefirst', document.getElementById('myRange').value);
        state = 'turn10end';
    } else if (state == 'turn10') {
        socket.emit(`turn10-raise`, document.getElementById('myRange').value);
        state = 'turn10end';
    }
});

document.getElementById('myRange').oninput = function () {
    document.getElementById('raise').innerText = `$${Math.round(document.getElementById('myRange').value)} 레이즈`;
};