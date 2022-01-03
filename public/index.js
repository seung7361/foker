const pattern_spc = /[~!@#$%^&*()_+|<>?:{}]/;
function setup() {
    createCanvas(windowWidth, windowHeight);

    while (myname.trim() == '' || myname == null) {
        myname = prompt('이름을 입력해주세요.').trim();
    }
    accept = createButton('네.');
    deny = createButton('아니오.');
    accept.position(width/2 - 150, height/2 + 100);
    accept.mousePressed(whenaccept);
    accept.style(`background-color`, `#4CAF50`);
    accept.style('border', 'none');
    accept.style('text-decoration', 'none');
    accept.style('color', 'none');
    accept.size(100, 100);
    deny.position(width/2 + 50, height/2 + 100);
    deny.mousePressed(whendeny);
    deny.style(`background-color`, `#4CAF50`);
    deny.style('border', 'none');
    deny.style('text-decoration', 'none');
    deny.style('color', 'none');
    deny.size(100, 100);
}

let myname = '';
function draw() {
    translate(width/2, height/2);
    background('#149BFC');
    textSize(50);
    textAlign(CENTER);
    textFont('Noto Sans KR');

    if (myname != '') {
        text(`당신의 이름이 맞나요?\n${myname}`, 0, 0);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    accept.position(width/2, height/2);
    deny.position(width/2, height/2);
}

function whenaccept() {
    if (pattern_spc.test(myname)) {
        alert('특수문자는 이름으로 입력하실 수 없습니다.');
        myname = '';
        whendeny();
    } else {
        window.location = `/play?name=${myname}`;
    }
}

function whendeny() {
    myname = '';
    while (myname.trim() == '' || myname == null) {
        myname = prompt('이름을 입력해주세요.').trim();
    }
    setup();
}