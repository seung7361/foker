const express = require('express');
const app = express();
const server = require('http').createServer(app);
const crypto = require('crypto');
//var id = crypto.randomBytes(7).toString('hex');
const shuffle = function (array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

const pattern_spc = /[~!@#$%^&*()_+|<>?:{}]/;
const cardstack = [
    'A_SPADE',
    '2_SPADE',
    '3_SPADE',
    '4_SPADE',
    '5_SPADE',
    '6_SPADE',
    '7_SPADE',
    '8_SPADE',
    '9_SPADE',
    '10_SPADE',
    'JACK_SPADE',
    'QUEEN_SPADE',
    'KING_SPADE',

    'A_DIAMOND',
    '2_DIAMOND',
    '3_DIAMOND',
    '4_DIAMOND',
    '5_DIAMOND',
    '6_DIAMOND',
    '7_DIAMOND',
    '8_DIAMOND',
    '9_DIAMOND',
    '10_DIAMOND',
    'JACK_DIAMOND',
    'QUEEN_DIAMOND',
    'KING_DIAMOND',

    'A_CLOVER',
    '2_CLOVER',
    '3_CLOVER',
    '4_CLOVER',
    '5_CLOVER',
    '6_CLOVER',
    '7_CLOVER',
    '8_CLOVER',
    '9_CLOVER',
    '10_CLOVER',
    'JACK_CLOVER',
    'QUEEN_CLOVER',
    'KING_CLOVER',

    'A_HEART',
    '2_HEART',
    '3_HEART',
    '4_HEART',
    '5_HEART',
    '6_HEART',
    '7_HEART',
    '8_HEART',
    '9_HEART',
    '10_HEART',
    'JACK_HEART',
    'QUEEN_HEART',
    'KING_HEART'

];

const jokercard = 'JOKER';

const jokerability = [
    '속독안',
    '파괴한다',
    '객관안on',
    '나르머크',
    '모를줄알았니?',
    '개같이멸망전'
];

const io = require('socket.io')(server);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static('public'));

app.get('/play', function (req, res) {
    // req.query.name (base64)

    res.sendFile(__dirname + '/public/play.html');
});

server.listen(3000, function () {
    console.log(`listening on *:3000`);
});

let room = new Array();
let serializedroom = new Array();
let userlist = new Array();
let serializeduserlist = new Array();
class Room {
    constructor(id, name, users, password, chat, isPublic) {
        this.id = id;
        this.name = name;
        this.users = users;
        this.isPublic = isPublic
        this.password = password;
        this.chat = chat;
        this.isIngame = false;
        this.countdown = 5;
        this.state = 'ready';
        this.call = 10;
        this.firstraiser = undefined;
    }

    isEveryoneReady = function () {
        if (this.users.length < 4) {
            return false;
        }

        for (let i = 0; i < this.users.length; i++) {
            if (!this.users[i].ready) {
                return false;
            }
        } return true;
    }

    gamestart = function () {
        this.isIngame = true;

        // init
        this.call = 10;
        this.state = 'turn1';
        this.countdown = 5;
        this.state = 'ready';
        this.call = 10;
        this.firstraiser = undefined;

        for (let i = 0; i < this.users.length; i++) {
            this.users[i].called = false;
            this.users[i].call = 10;
            this.users[i].state = '';
        }
        io.to(this.id).emit('res-updatecall', 'everyone', 10);
        io.to(this.id).emit('res-updatestate', 'everyone', '');


        // shuffle cards
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
                serializedroom[i].resetcardstack();
                serializedroom[i].shufflecardstack();

                for (let j = 0; j < serializedroom[i].users.length; j++) {
                    serializedroom[i].users[j].cardonhand = new Array();
                    serializedroom[i].users[j].cardonground = new Array();
                    serializedroom[i].users[j].cardonhand.push( serializedroom[i].cardstack.pop() );
                    serializedroom[i].users[j].cardonhand.push( serializedroom[i].cardstack.pop() );
                    serializedroom[i].users[j].cardonhand.push( serializedroom[i].cardstack.pop() );
                    serializedroom[i].users[j].cardonhand.push( serializedroom[i].cardstack.pop() );
                }
                console.log(cardstack.length);
            }
        }
        
        io.to(this.id).emit('res-gamestart', null);
        this.turn2();
    }

    turn2 = function () {
        this.state = 'turn2';

        for (let i = 0; i < this.users.length; i++) {
            this.users[i].focused = true;
        }
        io.to(this.id).emit('res-focused', 'everyone', true);
        io.to(this.id).emit('turn2', 'everyone');
        io.to(this.id).emit('res-updatecall', 'everyone', 10);
        io.to(this.id).emit('res-updatestate', 'everyone', '');
    }

    turn2endcheck = function () {
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].focused) {
                return 0;
            }
        }

        this.turn3();
    }
    
    turn3 = function () {
        this.state = 'turn3';
        for (let i = 0; i < this.users.length; i++) {
            this.users[i].focused = true;
        }
        io.to(this.id).emit('res-focused', 'everyone', true);
        io.to(this.id).emit('turn3', 'everyone');
    }

    turn3endcheck = function () {
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].focused) {
                return 0;
            }
        }

        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if ( serializedroom[i].id == this.id ) {
                index = i;
            }
        }

        for (let j = 0; j < serializedroom[index].users.length; j++) {
            serializedroom[index].users[j].cardonground.push(serializedroom[index].cardstack.pop());
            io.to(serializedroom[index].id).emit('res-updatecards-onground', serializedroom[index].users[j].id, serializedroom[index].users[j].cardonground);
        }

        // smallest money
        let moneylist = new Array();
        let smallest = 100000;
        for (let j = 0; j < this.users.length; j++) {
            if ( smallest > this.users[j].money ) {
                smallest = this.users[j].money;
            }
        }
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].money == smallest) {
                moneylist.push(i);
            }
        }
        for (let i = 0; i < moneylist.length; i++) {
            let jokerab = jokerability.slice();
            jokerab = shuffle(jokerab);
            serializedroom[index].users[ moneylist[i] ].jokeruser = true;
            serializedroom[index].users[ moneylist[i] ].jokerability.push(jokerab.pop());
            serializedroom[index].users[ moneylist[i] ].jokerability.push(jokerab.pop());
            serializedroom[index].users[ moneylist[i] ].jokerability.push(jokerab.pop());
            io.to(serializedroom[index].id).emit('res-jokercardselect', 'id', serializedroom[index].users[j].id);
            io.to(serializedroom[index].users[j].id).emit('res-jokercardselect', 'ability', serializedroom[index].users[j].id, jokerab);
        }

        this.turn3_5();
    }

    turn3_5 = function () {
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        for (let i = 0; i < serializedroom[index].users.length; i++) {
            if (serializedroom[index].users[i].jokeruser) {
                if (!serializedroom[index].users[i].jokerselected) {
                    return 0;
                }
            }
        }

        this.turnjoker();
    }

    turnjoker = function () {
        
    }

    turn4 = function () {
        this.state = 'turn4';
        let index;
        // sync with serializedroom
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }
        
        // one pair detection
        let opened = [];
        let onepair = [];
        for (let i = 0; i < serializedroom[index].users.length; i++) {
            if (cardToNumber(serializedroom[index].users[i].cardonground[0]) == cardToNumber(serializedroom[index].users[i].cardonground[1])) {
                onepair.push(i);
            }
        }

        console.log(onepair);
        if (onepair.length == 0) {
            // cards on ground to number => array
            for (let i = 0; i < serializedroom[index].users.length; i++) {
                console.log(serializedroom[index].users[i].cardonground[0], cardPower(serializedroom[index].users[i].cardonground[1]));
                let a = serializedroom[index].users[i].cardonground[0];
                let b = serializedroom[index].users[i].cardonground[1];
                opened.push(Math.max(cardPower(a), cardPower(b)));
            }
            console.log(opened);

            // get biggest among cards on ground
            let biggest = Math.max(...opened);
            console.log(biggest);
            for (let i = 0; i < serializedroom[index].users.length; i++) {
                let c = cardPower(serializedroom[index].users[i].cardonground[0]);
                let d = cardPower(serializedroom[index].users[i].cardonground[1]);
                if (Math.max(c, d) == biggest ) {
                    room[index].users[i].focused = true;
                    room[index].firstraiser = room[index].users[i].id;
                    io.to(this.id).emit('res-focused', serializedroom[index].users[i].id, true);
                    io.to(serializedroom[index].users[i].id).emit('res-turn4start', 1);
                    io.to(serializedroom[index].users[i].id).emit('res-turn4-3buttondecision', 1);
                    console.log(room[index].users[i].name);
                }
            }
        } else if (onepair.length == 1) {
            console.log(room[index].users[onepair[0]].cardonground);
            room[index].users[onepair[0]].focused = true;
            room[index].firstraiser = room[index].users[onepair[0]].id;
            io.to(this.id).emit('res-focused', serializedroom[index].users[onepair[0]].id, true);
            io.to(serializedroom[index].users[onepair[0]].id).emit('res-turn4start', 1);
            io.to(serializedroom[index].users[onepair[0]].id).emit('res-turn4-3buttondecision', 1);
            console.log(room[index].users[onepair[0]].name);
        } else {
            // onepair length > 2
            // two or more is onepair
            if (cardToNumber(serializedroom[index].users[onepair[0]].cardonground[0]) > cardToNumber(serializedroom[index].users[onepair[1]].cardonground[0])) {
                console.log(room[index].users[onepair[0]].cardonground);
                room[index].users[onepair[0]].focused = true;
                room[index].firstraiser = room[index].users[onepair[0]].id;
                io.to(this.id).emit('res-focused', serializedroom[index].users[onepair[0]].id, true);
                io.to(serializedroom[index].users[onepair[0]].id).emit('res-turn4start', 1);
                io.to(serializedroom[index].users[onepair[0]].id).emit('res-turn4-3buttondecision', 1);
                console.log(room[index].users[onepair[0]].name);
            } else if (cardToNumber(serializedroom[index].users[onepair[0]].cardonground[0]) < cardToNumber(serializedroom[index].users[onepair[1]].cardonground[0])) {
                console.log(room[index].users[onepair[1]].cardonground);
                room[index].users[onepair[1]].focused = true;
                room[index].firstraiser = room[index].users[onepair[1]].id;
                io.to(this.id).emit('res-focused', serializedroom[index].users[onepair[1]].id, true);
                io.to(serializedroom[index].users[onepair[1]].id).emit('res-turn4start', 1);
                io.to(serializedroom[index].users[onepair[1]].id).emit('res-turn4-3buttondecision', 1);
                console.log(room[index].users[onepair[1]].name);
            } else {
                // same number
                let a = cardPower(serializedroom[index].users[onepair[0]].cardonground[0]);
                let b = cardPower(serializedroom[index].users[onepair[0]].cardonground[1]);
                let c = cardPower(serializedroom[index].users[onepair[1]].cardonground[0]);
                let d = cardPower(serializedroom[index].users[onepair[1]].cardonground[1]);
                
                let max0 = Math.max(a, b);
                let max1 = Math.max(c, d);
                if (max0 > max1) {
                    console.log(room[index].users[onepair[0]].cardonground);
                    room[index].users[onepair[0]].focused = true;
                    room[index].firstraiser = room[index].users[onepair[0]].id;
                    io.to(this.id).emit('res-focused', serializedroom[index].users[onepair[0]].id, true);
                    io.to(serializedroom[index].users[onepair[0]].id).emit('res-turn4start', 1);
                    io.to(serializedroom[index].users[onepair[0]].id).emit('res-turn4-3buttondecision', 1);
                    console.log(room[index].users[onepair[0]].name);
                } else {
                    console.log(room[index].users[onepair[1]].cardonground);
                    room[index].users[onepair[1]].focused = true;
                    room[index].firstraiser = room[index].users[onepair[1]].id;
                    io.to(this.id).emit('res-focused', serializedroom[index].users[onepair[1]].id, true);
                    io.to(serializedroom[index].users[onepair[1]].id).emit('res-turn4start', 1);
                    io.to(serializedroom[index].users[onepair[1]].id).emit('res-turn4-3buttondecision', 1);
                    console.log(room[index].users[onepair[1]].name);
                }

            }

        }

        

    }
    
    turn4endcheck = function () {
        for (let j = 0; j < this.users.length; j++) {
            if (this.users[j].state == 'die') {
                this.users[j].called = true;
            }
            if (!this.users[j].called) {
                this.users[j].focused = true;
                io.to(this.id).emit('res-focused', this.users[j].id, true);
                io.to(this.users[j].id).emit('res-turn4-3buttondecision', 0);
                return 0;
            }
        }

        this.turn5();
    }

    turn5 = function () {
        this.state = 'turn5';
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        for (let j = 0; j < serializedroom[index].users.length; j++) {
            if (room[index].users[j].state != 'die') {
                serializedroom[index].users[j].cardonground.push(serializedroom[index].cardstack.pop());
                io.to(serializedroom[index].id).emit('res-updatecards-onground', serializedroom[index].users[j].id, serializedroom[index].users[j].cardonground);
            }
        }

        this.turn5endcheck();
    }

    turn5endcheck = function () {
        this.turn6();
    }

    turn6 = function () {
        this.state = 'turn6';
        let index;
        // sync with serializedroom
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        // reset
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].state != 'die') {
                this.users[i].called = false;
            }
        } this.turn6endcheck();
            /*
            // triple detect
        let triple = [];
        for (let i = 0; i < serializedroom[index].users.length; i++) {
            if (room[index].users[i].state == 'die') {
                continue;
            }
            let a = serializedroom[index].users[i].cardonground[0];
            let b = serializedroom[index].users[i].cardonground[1];
            let c = serializedroom[index].users[i].cardonground[2];
            if (cardToNumber(a) == cardToNumber(b) == cardToNumber(c)) {
                triple.push(i);
            }
        }

        // onepair detect
        let onepair = [];
        for (let i = 0; i < serializedroom[index].users.length; i++) {
            if (room[index].users[i].state == 'die') {
                continue;
            }
            let a = cardPower(serializedroom[index].users[i].cardonground[0]);
            let b = cardPower(serializedroom[index].users[i].cardonground[1]);
            let c = cardPower(serializedroom[index].users[i].cardonground[2]);
            if (a == b || b == c || c == a) {
                onepair.push(i);
            }
        }

        if (triple.length == 0) {

            // no triple
            if (onepair.length == 0) {
                // no triple no onepair

                // cards on ground to number => array
                let opened = [];
                for (let i = 0; i < serializedroom[index].users.length; i++) {
                    console.log(serializedroom[index].users[i].cardonground[0],
                        cardPower(serializedroom[index].users[i].cardonground[1]),
                        cardPower(serializedroom[index].users[i].cardonground[2]));
                    let a = serializedroom[index].users[i].cardonground[0];
                    let b = serializedroom[index].users[i].cardonground[1];
                    let c = serializedroom[index].users[i].cardonground[2];
                    opened.push(Math.max(cardPower(a), cardPower(b), cardPower(c)));
                }
                console.log(opened);

                // get biggest among cards on ground
                let biggest = Math.max(...opened);
                console.log(biggest);
                for (let i = 0; i < serializedroom[index].users.length; i++) {
                    let c = cardPower(serializedroom[index].users[i].cardonground[0]);
                    let d = cardPower(serializedroom[index].users[i].cardonground[1]);
                    let e = cardPower(serializedroom[index].users[i].cardonground[2]);
                    if (Math.max(c, d, e) == biggest) {
                        room[index].users[i].focused = true;
                        room[index].firstraiser = room[index].users[i].id;
                        io.to(this.id).emit('res-focused', serializedroom[index].users[i].id, true);
                        io.to(serializedroom[index].users[i].id).emit('res-turn6start', 1);
                        io.to(serializedroom[index].users[i].id).emit('res-turn6-3buttondecision', 1);
                        console.log(room[index].users[i].name);
                    }
                }
            } else if (onepair.length == 1) {
                // no triple one onepair
                this.firstraiser = serializedroom[index].users[onepair[0]].id;

                io.to(this.id).emit('res-focused', this.firstraiser, true);
                io.to(this.firstraiser).emit('res-turn6start', 1);
                io.to(this.firstraise).emit('res-turn6-3buttondecision', 1);
                console.log(room[index].users[onepair[0]].name);
            } else {
                
                // no triple two+ onepair
                let winner = [];
                for (let i = 0; i < onepair.length; i++) {
                    let a = serializedroom[index].users[onepair[i]].cardonground[0];
                    let b = serializedroom[index].users[onepair[i]].cardonground[1];
                    let c = serializedroom[index].users[onepair[i]].cardonground[2];

                    if (cardToNumber(a) == cardToNumber(b)) {
                        winner.push(Math.max(cardPower(a), cardPower(b)));
                    } else if (cardToNumber(b) == cardToNumber(c)) {
                        winner.push(Math.max(cardPower(b), cardPower(c)));
                    } else {
                        winner.push(Math.max(cardPower(a), cardPower(c)));
                    }
                }

                let biggest = Math.max(...winner);
                let idx;
                for (let i = 0; i < onepair.length; i++) {
                    for (let j = 0; j < serializedroom[index].users[onepair[i]].cardonground.length; j++) {
                        if (serializedroom[index].users[onepair[i]].cardonground[j] == biggest) {
                            idx = onepair[i];
                        }
                    }
                }

                this.firstraiser = serializedroom[index].users[idx].id;

                io.to(this.id).emit('res-focused', this.firstraiser, true);
                io.to(this.firstraiser).emit('res-turn6start', 1);
                io.to(this.firstraiser).emit('res-turn6-3buttondecision', 1);
                console.log(room[index].users[onepair[idx]].name);

            }


        } else if (triple.length == 1) {

            // only 1 triple
            this.firstraiser = serializedroom[index].users[triple[0]].id;

            io.to(this.id).emit('res-focused', this.firstraiser, true);
            io.to(this.firstraiser).emit('res-turn6start', 1);
            io.to(this.firstraiser).emit('res-turn6-3buttondecision', 1);
            console.log(room[index].users[triple[0]].name);

        } else {
            // two+ triples
            let opened = [];
            for (let i = 0; i < serializedroom[index].users.length; i++) {
                opened.push(cardPower(serializedroom[index].users[i].cardonground[0]));
            }
            let biggest = Math.max(...opened);
            for (let i = 0; i < serializedroom[index].users.length; i++) {
                if (cardPower(serializedroom[index].users[i].cardonground[0]) == biggest) {
                    this.firstraiser = serializedroom[index].users[i].id;

                    io.to(this.id).emit('res-focused', this.firstraiser, true);
                    io.to(this.firstraiser).emit('res-turn6start', 1);
                    io.to(this.firstraiser).emit('res-turn6-3buttondecision', 1);
                    console.log(room[index].users[i].name);
                }
            }
        }*/
    }

    turn6endcheck = function () {
        for (let j = 0; j < this.users.length; j++) {
            if (this.users[j].state == 'die') {
                this.users[j].called = true;
            }
            if (!this.users[j].called) {
                this.users[j].focused = true;
                io.to(this.id).emit('res-focused', this.users[j].id, true);
                io.to(this.users[j].id).emit('res-turn6-3buttondecision', 0);
                return 0;
            }
        }

        this.turn7();
    }

    turn7 = function () {
        this.state = 'turn7';
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        for (let j = 0; j < serializedroom[index].users.length; j++) {
            if (room[index].users[j].state != 'die') {
                serializedroom[index].users[j].cardonground.push(serializedroom[index].cardstack.pop());
                io.to(serializedroom[index].id).emit('res-updatecards-onground', serializedroom[index].users[j].id, serializedroom[index].users[j].cardonground);
            }
        }

        this.turn7endcheck();
    }

    turn7endcheck = function () {
        this.turn8();
    }

    turn8 = function () {
        this.state = 'turn8';
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        // reset
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].state != 'die') {
                this.users[i].called = false;
            }
        }

        /*
        let size = [];
        for (let i = 0; i < serializedroom[index].users.length; i++) {

            let temp = serializedroom[index].users[i].cardonground;
            temp.push('DUMMY_DUMMY');

            size.push( checkcards(temp) );
        }

        let biggest = Math.max(...size);
        for (let i = 0; i < serializedroom[index].users.length; i++) {

            let temp = serializedroom[index].users[i].cardonground;
            temp.push('DUMMY_DUMMY');
            console.log(room[index].users[i].name, checkcards(temp), biggest);

            if ( checkcards(temp) == biggest ) {
                this.firstraiser = serializedroom[index].users[i].id;

                io.to(this.id).emit('res-focused', this.firstraiser, true);
                io.to(this.firstraiser).emit('res-turn8start', 1);
                io.to(this.firstraiser).emit('res-turn8-3buttondecision', 1);
                console.log(room[index].users[onepair[i]].name);
            }
        }
        */
       this.turn8endcheck();
    }

    turn8endcheck = function () {
        for (let j = 0; j < this.users.length; j++) {
            if (this.users[j].state == 'die') {
                this.users[j].called = true;
            }
            if (!this.users[j].called) {
                this.users[j].focused = true;
                io.to(this.id).emit('res-focused', this.users[j].id, true);
                io.to(this.users[j].id).emit('res-turn8-3buttondecision', 0);
                return 0;
            }
        }

        this.turn9();
    }

    turn9 = function () {
        this.state = 'turn9';
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        // get a hidden card
        io.to(serializedroom[index].id).emit('res-updatecards-addhiddencard', null);

        this.turn9endcheck();
    }

    turn9endcheck = function () {
        this.turn10();
    }

    turn10 = function () {
        this.state = 'turn10';
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        // reset
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].state != 'die') {
                this.users[i].called = false;
            }
        }
        /*
        let size = [];
        for (let i = 0; i < serializedroom[index].users.length; i++) {

            let temp = serializedroom[index].users[i].cardonground;
            temp.push('DUMMY_DUMMY');

            size.push(checkcards(temp));
        }

        let biggest = Math.max(...size);
        for (let i = 0; i < serializedroom[index].users.length; i++) {

            let temp = serializedroom[index].users[i].cardonground;
            temp.push('DUMMY_DUMMY');

            if (checkcards(temp) == biggest) {
                this.firstraiser = serializedroom[index].users[idx].id;

                io.to(this.id).emit('res-focused', this.firstraiser, true);
                io.to(this.firstraiser).emit('res-turn10start', 1);
                io.to(this.firstraiser).emit('res-turn10-3buttondecision', 1);
                console.log(room[index].users[onepair[idx]].name);
            }
        }*/
        this.turn10endcheck();
    }

    turn10endcheck = function () {
        for (let j = 0; j < this.users.length; j++) {
            if (this.users[j].state == 'die') {
                this.users[j].called = true;
            }
            if (!this.users[j].called) {
                this.users[j].focused = true;
                io.to(this.id).emit('res-focused', this.users[j].id, true);
                io.to(this.users[j].id).emit('res-turn10-3buttondecision', 0);
                return 0;
            }
        }

        this.turn11();
    }

    turn11 = function () {
        this.state = 'turn11';
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        console.log(serializedroom[index].cardstack);
        for (let j = 0; j < serializedroom[index].users.length; j++) {
            if (room[index].users[j].state != 'die') {
                let a = serializedroom[index].cardstack.pop();
                serializedroom[index].users[j].cardonground.push(a);
                io.to(serializedroom[index].id).emit('res-updatecards-hidden', serializedroom[index].users[j].id, a);
                io.to(serializedroom[index].id).emit('res-updatecards', serializedroom[index].users[j].id, serializedroom[index].users[j].cardonhand);
            }
            console.log(room[index].users[j].name);
            console.log(serializedroom[index].users[j].cardonhand, serializedroom[index].users[j].cardonground);
        }

        this.turn11endcheck();
    }

    turn11endcheck = function () {
        this.state = 'turn11endcheck';
        let index;
        for (let i = 0; i < serializedroom.length; i++) {
            if (serializedroom[i].id == this.id) {
                index = i;
            }
        }

        let opened = [], prize = 0;
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].state != 'die') {

                let a = serializedroom[index].users[i].cardonhand;
                let b = serializedroom[index].users[i].cardonground;
                
                let concat = a.concat(b);
                opened.push( combinationPower(concat) );
            }

            if (this.users.state == 'die') {
                prize += this.users[i].call;
            } else {
                prize += this.call;
            }
        }
        console.log(opened, prize);

        let biggest = Math.max(...opened);
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].state == 'die') continue;

            let a = serializedroom[index].users[i].cardonhand;
            let b = serializedroom[index].users[i].cardonground;

            let concat = a.concat(b);
            if ( biggest == combinationPower(concat) ) {
                this.users[i].money += prize;
                io.to(this.id).emit('res-updatemoney', this.users[i].id, this.users[i].money);
                this.chat += `System###${this.users[i].name}님이 $${prize}을 탔습니다.^^^`;
                io.to(this.id).emit('res-updateroominfo', this);
            } else {
                
                if (this.users[i].state == 'die') {
                    this.users[i].money -= this.users[i].call;
                    io.to(this.id).emit('res-updatemoney', this.users[i].id, this.users[i].money);
                } else {
                    this.users[i].money -= this.call;
                    io.to(this.id).emit('res-updatemoney', this.users[i].id, this.users[i].money);
                }

            }
        }

        this.startcountdown();
    }

    startcountdown = function () {
        if (this.countdown == 0) {
            this.gamestart();
            return 0;
        }

        if (!this.isEveryoneReady()) {
            this.countdown = 5;
            this.chat += `System###모두가 준비를 해야 게임이 시작됩니다.^^^`;
            io.to(this.id).emit('res-updateroominfo', this);
            return 0;
        }
            
        this.chat += `System###${this.countdown}초 뒤 새로운 게임이 시작됩니다...^^^`;
        io.to(this.id).emit('res-updateroominfo', this);
        this.countdown--;
        setTimeout(function () {this.startcountdown()}.bind(this), 1000);
    }
}

class SerializedRoom {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.cardstack = [...cardstack];
        this.users = [];
    }

    resetcardstack = function () {
        this.cardstack = [...cardstack];
    }

    shufflecardstack = function () {
        this.cardstack = shuffle(this.cardstack);
    }
}

class User {
    constructor(id, name, usernum) {
        this.id = id;
        this.name = name;
        this.usernum = usernum;
        this.maderoom = 0;
        this.ready = false;

        this.call = 10;
        this.state = '';
        this.focused = false;
        this.money = 200;
        this.called = false;
    }
}


class SerializedUser {
    constructor(id, name, usernum) {
        this.id = id;
        this.name = name;
        this.usernum = usernum;

        this.cardonhand = [];
        this.cardonground = [];

        this.jokeruser = false;
        this.jokerselected = false;
        this.jokerability = [];
    }
}


io.on('connection', function (socket) {
    console.log(`We have a new client on the server: ${socket.id}`);
    let randomnumber = crypto.randomBytes(7).toString('hex');
    let user = new User(socket.id, null, randomnumber);
    userlist.push(user);
    let serializeduser = new SerializedUser(socket.id, null, randomnumber);
    serializeduserlist.push(serializeduser);

    socket.on('req-jokercardselect', function (data) {
        data = parseInt(data);

        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id) {
                    // sync
                    let index;
                    for (let k = 0; k < serializedroom.length; k++) {
                        if (serializedroom[k].id == room[i].id) {
                            index = k;
                        }
                    }

                    serializedroom[index].users[j].jokerselected = true;
                    serializedroom[index].users[j].jokercard = serializedroom[index].users[j].jokercard[data-1];
                    room[i].turn3_5();
                }
            }
        }
    });

    socket.on('turn10-die', function (data) {
        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id) {
                    room[i].users[j].state = 'die';
                    room[i].users[j].called = true;
                    io.to(room[i].id).emit('res-updatestate', socket.id, 'die');
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn10endcheck();
                }
            }
        }
    });

    socket.on('turn10-call', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn10') {
                        console.log(room[i].state);
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    room[i].users[j].called = true;
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn10endcheck();
                }
            }
        }
    });

    socket.on('turn10-raise', function (data) {
        console.log('turn10-raise detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn10') {
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    if (room[i].users[j].money < room[i].call + parseInt(data)) {
                        return 0;
                    }
                    for (let k = 0; k < serializedroom[i].users.length; k++) {
                        room[i].users[k].called = false;
                    }
                    room[i].users[j].called = true;

                    
                    
                    room[i].call += parseInt(data);
                    room[i].users[j].call = room[i].call;
                    console.log('raise', room[i].users[j].call);
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn10endcheck();
                }
            }
        }
    });

    socket.on('turn10-raisefirst', function (data) {
        console.log('turn10-raisefirst detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn10') {
                        socket.emit('illegal_statement', null);
                    }
                    if (room[i].users[j].money < room[i].call + parseInt(data)) {
                        return 0;
                    }
                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].call += parseInt(data);
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    for (let k = 0; k < room[i].users.length; k++) {
                        room[i].users[k].call = room[i].call;
                    }
                    io.to(room[i].id).emit('res-updateroomcall', room[i].call);
                    room[i].turn10endcheck();
                }
            }
        }
    });

    socket.on('turn10-callfirst', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn10') {
                        socket.emit('illegal_statement', null);
                    }
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    // room[i].call
                    room[i].turn10endcheck();
                }
            }
        }
    });

    socket.on('turn8-die', function (data) {
        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id) {
                    room[i].users[j].state = 'die';
                    room[i].users[j].called = true;
                    io.to(room[i].id).emit('res-updatestate', socket.id, 'die');
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn8endcheck();
                }
            }
        }
    });

    socket.on('turn8-call', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn8') {
                        console.log(room[i].state);
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    room[i].users[j].called = true;
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn8endcheck();
                }
            }
        }
    });

    socket.on('turn8-raise', function (data) {
        console.log('turn6-raise detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn8') {
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    if (room[i].users[j].money < room[i].call + parseInt(data)) {
                        return 0;
                    }
                    for (let k = 0; k < serializedroom[i].users.length; k++) {
                        room[i].users[k].called = false;
                    }
                    room[i].users[j].called = true;
                    room[i].call += parseInt(data);
                    room[i].users[j].call = room[i].call;
                    console.log('raise', room[i].users[j].call);
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn8endcheck();
                }
            }
        }
    });

    socket.on('turn8-raisefirst', function (data) {
        console.log('turn6-raisefirst detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn8') {
                        socket.emit('illegal_statement', null);
                    }
                    if (room[i].users[j].money < room[i].call + parseInt(data)) {
                        return 0;
                    }

                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].call += parseInt(data);
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    for (let k = 0; k < room[i].users.length; k++) {
                        room[i].users[k].call = room[i].call;
                    }
                    io.to(room[i].id).emit('res-updateroomcall', room[i].call);
                    room[i].turn8endcheck();
                }
            }
        }
    });

    socket.on('turn8-callfirst', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn8') {
                        socket.emit('illegal_statement', null);
                    }
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    // room[i].call
                    room[i].turn8endcheck();
                }
            }
        }
    });

    socket.on('turn6-die', function (data) {
        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id) {
                    room[i].users[j].state = 'die';
                    room[i].users[j].called = true;
                    io.to(room[i].id).emit('res-updatestate', socket.id, 'die');
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn6endcheck();
                }
            }
        }
    });

    socket.on('turn6-call', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn6') {
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    room[i].users[j].called = true;
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn6endcheck();
                }
            }
        }
    });

    socket.on('turn6-raise', function (data) {
        console.log('turn6-raise detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn6') {
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    if (room[i].users[j].money < room[i].call + parseInt(data)) {
                        return 0;
                    }
                    for (let k = 0; k < serializedroom[i].users.length; k++) {
                        room[i].users[k].called = false;
                    }
                    room[i].users[j].called = true;
                    room[i].call += parseInt(data);
                    room[i].users[j].call = room[i].call;
                    console.log('raise', room[i].users[j].call);
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn6endcheck();
                }
            }
        }
    });

    socket.on('turn6-raisefirst', function (data) {
        console.log('turn6-raisefirst detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn6') {
                        socket.emit('illegal_statement', null);
                    }
                    if (room[i].users[j].money < room[i].call + parseInt(data)) {
                        return 0;
                    }

                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].call += parseInt(data);
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    for (let k = 0; k < room[i].users.length; k++) {
                        room[i].users[k].call = room[i].call;
                    }
                    io.to(room[i].id).emit('res-updateroomcall', room[i].call);
                    room[i].turn6endcheck();
                }
            }
        }
    });

    socket.on('turn6-callfirst', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn6') {
                        socket.emit('illegal_statement', null);
                    }
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    // room[i].call
                    room[i].turn6endcheck();
                }
            }
        }
    });

    socket.on('turn4-die', function (data) {
        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id) {
                    room[i].users[j].state = 'die';
                    room[i].users[j].called = true;
                    io.to(room[i].id).emit('res-updatestate', socket.id, 'die');
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn4endcheck();
                }
            }
        }
    });

    socket.on('turn4-call', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn4') { 
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    room[i].users[j].called = true;
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn4endcheck();
                }
            }
        }
    });

    socket.on('turn4-raise', function (data) {
        console.log('turn4-raise detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && !room[i].users[j].called) {
                    if (room[i].state != 'turn4') {
                        socket.emit('illegal_statement', null);
                        return 0;
                    }
                    for (let k = 0; k < serializedroom[i].users.length;k++) {
                        room[i].users[k].called = false;
                    }
                    room[i].users[j].called = true;
                    room[i].call += parseInt(data);
                    room[i].users[j].call = room[i].call;
                    console.log('raise', room[i].users[j].call);
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].turn4endcheck();
                }
            }
        }
    });

    socket.on('turn4-callfirst', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn4') {
                        socket.emit('illegal_statement', null);
                    }
                    if (room[i].users[j].money >= room[i].call) {
                        room[i].users[j].call = room[i].call;
                    } else {
                        // all in
                        room[i].users[j].call = room[i].users[j].money;
                    }
                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id , false);
                    room[i].call = 10;
                    room[i].turn4endcheck();
                }
            }
        }
    });

    socket.on('turn4-raisefirst', function (data) {
        console.log('turn4-raisefirst detected.');
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id && room[i].firstraiser == socket.id) {
                    if (room[i].state != 'turn4') {
                        socket.emit('illegal_statement', null);
                    }

                    room[i].users[j].called = true;
                    room[i].users[j].focused = false;
                    io.to(room[i].id).emit('res-focused', room[i].users[j].id, false);
                    room[i].call = 10 + parseInt(data);
                    room[i].users[j].call = room[i].call;
                    io.to(room[i].id).emit('res-updatecall', room[i].users[j].id, room[i].users[j].call);
                    room[i].turn4endcheck();
                }
            }
        }
    });

    socket.on('req-turn3', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id) {
                    if (room[i].state != 'turn3') {
                        socket.emit('illegal_statement', null);
                        return 0;
                    }

                    for (let k = 0; k < serializedroom[i].users[j].cardonhand.length; k++) {
                        if (serializedroom[i].users[j].cardonhand[k] == data) {
                            // move card hand -> ground
                            serializedroom[i].users[j].cardonground.push(data);
                            serializedroom[i].users[j].cardonhand.splice(k, 1);
                            socket.to(room[i].id).emit('res-updatecards', serializedroom[i].users[j].id, ['back','back']);

                            room[i].users[j].focused = false;
                            io.to(serializedroom[i].id).emit('res-focused', serializedroom[i].users[j].id, false);

                           io.to(serializedroom[i].users[j].id).emit('res-updatecards', serializedroom[i].users[j].id, serializedroom[i].users[j].cardonhand);
                            io.to(serializedroom[i].id).emit('res-updatecards-onground', serializedroom[i].users[j].id, serializedroom[i].users[j].cardonground);

                            socket.emit('res-turn3', null);
                            room[i].turn3endcheck();
                        }
                    }
                }
            }
        }
    });

    socket.on('req-turn2', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id) {
                    if (room[i].state != 'turn2') {
                        socket.emit('illegal_statement', null);
                        return 0;
                    }

                    for (let k = 0; k < serializedroom[i].users[j].cardonhand.length; k++) {
                        if (serializedroom[i].users[j].cardonhand[k] == data) {
                            serializedroom[i].users[j].cardonhand.splice(k, 1);
                            room[i].users[j].focused = false;
                            io.to(serializedroom[i].id).emit('res-focused', serializedroom[i].users[j].id, false);
                            io.to(serializedroom[i].id).emit('res-updatecards', serializedroom[i].users[j].id, ['back', 'back', 'back']);
                            socket.emit('res-turn2', serializedroom[i].users[j].cardonhand);
                            room[i].turn2endcheck();
                        }
                    }
                }
            }
        }
    });

    socket.on('req-mycardinit', function (data) {
        for (let i = 0; i < serializedroom.length; i++) {
            for (let j = 0; j < serializedroom[i].users.length; j++) {
                if (serializedroom[i].users[j].id == socket.id) {
                    socket.emit('res-mycardinit', serializedroom[i].users[j].cardonhand);
                    return 0;
                }
            }
        }

        socket.emit('illegal_statement', null);
    });

    socket.on('init', function (hisname) {
        for (let i = 0; i < userlist.length; i++) {
            if (userlist[i].id == socket.id) {
                userlist[i].name = decodeURIComponent(hisname);
            }
        }
        if (pattern_spc.test(decodeURIComponent(hisname))) {
            socket.emit('illegal_statement', hisname);
            socket.disconnect();
        }
    });

    socket.on('req-roomlist', function (data) {
        let temp = new Array();
        for (let i = 0; i < room.length; i++) {
            if (room[i].isPublic) {
                temp.push({
                    id: room[i].id,
                    name: room[i].name,
                    users: room[i].users.length
                });
            }
        }
        socket.emit('res-roomlist', temp);
    });

    socket.on('disconnect', function () {
        console.log(`${socket.id} just disappeared from the server.`);


        for (let i = 0; i < userlist.length; i++) {
            if (userlist[i].id == socket.id) {
                userlist.splice(i, 1);
            }
        }

        for (let i = 0; i < serializeduserlist.length; i++) {
            if (serializeduserlist[i].id == socket.id) {
                serializeduserlist.splice(i, 1);
            }
        }

        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id ) {
                    room[i].users.splice(j, 1);
                    serializedroom[i].users.splice(j, 1);
                    io.to(room[i].id).emit('res-updateroominfo', room[i]);
                }
            }

            if(room[i].users.length == 0) {
                room.splice(i, 1);
                serializedroom.splice(i, 1);
            }
        }

    });


    socket.on('req-makeroom', function (data) {
        for (let i = 0; i < userlist.length; i++) {
            if (userlist[i].id == socket.id && userlist[i].maderoom >= 2) {
                socket.emit('res-makeroom', 1); // unsuccessful
                return 0;
            }
        }

        let roomid = crypto.randomBytes(2).toString('hex');
        let pwrd = crypto.createHash('sha256').update(data.password).digest('base64');
        room.push(new Room( roomid, data.name, [], pwrd, '', data.isPublic ));
        serializedroom.push(new SerializedRoom(roomid, data.name));
        socket.emit('res-makeroom', roomid, data.password);
        for (let i = 0; i < userlist.length; i++) {
            if (userlist[i].id == socket.id ) {
                userlist[i].maderoom++;
            }
        }
    });

    socket.on('req-roomjoin', function (rid, pwrd) {
        for (let i = 0; i < room.length; i++) {
            if (room[i].id == rid) {

                if (room[i].password == crypto.createHash('sha256').update(pwrd).digest('base64')) { // password ok

                    // if he's already in a different room - leave
                    for (let k = 0; k < room.length; k++) {
                        for (let l = 0; l < room[k].users.length; l++) {
                            if (room[k].users[l].id == socket.id) {
                                room[k].users.splice(l, 1);
                                serializedroom[k].users.splice(l, 1);
                                socket.leave(room[k].id);
                            }
                        }
                    }

                    // send him the room info & join the room
                    for (let j = 0; j < userlist.length; j++) {
                        if (userlist[j].id == socket.id) {
                            room[i].users.push(userlist[j]);
                            serializedroom[i].users.push(serializeduserlist[j]);
                            io.to(room[i].id).emit('res-updateroominfo', room[i]);
                        }
                    }
                    socket.join(room[i].id);
                    socket.emit('res-roomjoin', room[i], 0);

                    for (let m = 0; m < room.length; m++) {
                        if (room[m].users.length == 0) {
                            room.splice(m, 1);
                            serializedroom.splice(m, 1);
                        }
                    }
                    return 0;
                } else { // password error
                    socket.emit('res-roomjoin', {error: 'passworderror'}, 1);
                    return 0;
                }
            }
        } // no such room error
        socket.emit('res-roomjoin', {error: 'nosuchroom'}, 1);

        
    });

    socket.on('req-ready', function (data) {
        for (let i = 0; i < userlist.length; i++) {
            if (userlist[i].id == socket.id) {
                if (userlist[i].ready) { userlist[i].ready = false; }
                else { userlist[i].ready = true; }
            }
        }
        
        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id) {
                    io.to(room[i].id).emit('res-updateroominfo', room[i]);
                }
            }
            if (room[i].countdown != 5) {
                return 0;
            }

            if (room[i].isEveryoneReady()) {
                room[i].startcountdown();
            }
        }
    });

    socket.on('req-message', function (data) {
        for (let i = 0; i < room.length; i++) {
            for (let j = 0; j < room[i].users.length; j++) {
                if (room[i].users[j].id == socket.id) {
                    room[i].chat += `${room[i].users[j].name}###${data}^^^`;
                    io.to(room[i].id).emit('res-updateroominfo', room[i]);
                }
            }
        }
    });
});

function checkcards(stack) {
    console.log(stack);
    // stack bubblesort
    for (let i = 0; i < stack.length; i++) {
        for (let j = 0; j < (stack.length - i - 1); j++) {
            if (cardToNumber(stack[j]) > cardToNumber(stack[j + 1])) {
                let temp = stack[j];
                stack[j] = stack[j + 1];
                stack[j + 1] = temp;
            }
        }
    }

    // stack to number or pattern
    let number = new Array();
    let pattern = new Array();
    for (let i = 0; i < stack.length; i++) {
        number[i] = cardToNumber(stack[i]);
        pattern[i] = cardToPattern(stack[i]);
    }

    // stack.length = 5 Always
    let all_same_pattern;
    if (pattern[0] == pattern[1] &&
        pattern[1] == pattern[2] &&
        pattern[2] == pattern[3] &&
        pattern[3] == pattern[4]) {
        all_same_pattern = true;
    } else {
        all_same_pattern = false;
    }


    // console.log(stack, all_same_pattern);
    // console.log(number, pattern);

    // ROYAL_STRAIGHT_FLUSH = 12
    if (all_same_pattern && number[0] == 10 && number[1] == 11 && number[2] == 12 && number[3] == 13 && number[4] == 14) {
        return `1200${patternToNumber(pattern[0])}`;
    }

    // BACK_STRAIGHT_FLUSH = 11
    if (all_same_pattern && number[0] == 2 && number[1] == 3 && number[2] == 4 && number[3] == 5 && number[4] == 14) {
        return `1100${patternToNumber(pattern[0])}`;
    }

    // STRAIGHT_FLUSH = 10
    if (all_same_pattern && number[0] + 1 == number[1] && number[1] + 1 == number[2] && number[2] + 1 == number[3] && number[3] + 1 == number[4]) {
        return `10${numberToString(number[4])}${patternToNumber(pattern[0])}`;
    }

    // FOUR_CARDS = 9
    if ((number[0] == number[1] && number[1] == number[2] && number[2] == number[3]) || (number[1] == number[2] && number[2] == number[3] && number[3] == number[4])) {
        return `9${numberToString(number[2])}4`;
    }

    // FULL_HOUSE = 8
    // AAABB
    if (number[0] == number[1] && number[1] == number[2] && number[3] == number[4]) {
        return `8${numberToString(number[0])}4`;
    }
    // AABBB
    if (number[0] == number[1] && number[2] == number[3] && number[3] == number[4]) {
        return `8${numberToString(number[4])}4`;
    }

    // FLUSH = 7
    if (all_same_pattern) {
        return `7${number[4]}${patternToNumber(pattern[0])}`;
    }

    // MOUNTAIN = 6
    if (number[0] == 10 && number[1] == 11 && number[2] == 12 && number[3] == 13 && number[4] == 14) {
        return `600${patternToNumber(pattern[4])}`;
    }

    // BACK_STRAIGHT = 5
    if (number[0] == 2 && number[1] == 3 && number[2] == 4 && number[3] == 5 && number[4] == 14) {
        return `500${patternToNumber(pattern[3])}`;
    }

    // STRAIGHT = 4
    if (number[0] + 1 == number[1] && number[1] + 1 == number[2] && number[2] + 1 == number[3] && number[3] + 1 == number[4]) {
        return `4${numberToString(number[4])}${patternToNumber(pattern[4])}`;
    }

    // TRIPLE = 3
    // AAABC
    if (number[0] == number[1] && number[1] == number[2]) {
        return `3${number[2]}${patternToNumber(pattern[2])}`;
    }
    // ABBBC
    if (number[1] == number[2] && number[2] == number[3]) {
        return `3${number[3]}${patternToNumber(pattern[3])}`;
    }
    // ABCCC
    if (number[2] == number[3] && number[3] == number[4]) {
        return `3${number[4]}${patternToNumber(pattern[4])}`;
    }

    // TWO_PAIR = 2
    // AABBC
    if (number[0] == number[1] && number[2] == number[3]) {
        return `2${numberToString(number[3])}${Math.max(patternToNumber(pattern[2]), patternToNumber(pattern[3]))}`;
    }
    //AABCC
    if (number[0] == number[1] && number[3] == number[4]) {
        return `2${numberToString(number[4])}${Math.max(patternToNumber(pattern[3]), patternToNumber(pattern[4]))}`;
    }
    //ABBCC
    if (number[1] == number[2] && number[3] == number[4]) {
        return `2${numberToString(number[4])}${Math.max(patternToNumber(pattern[3]), patternToNumber(pattern[4]))}`;
    }

    // ONE_PAIR = 1
    // AABCD
    if (number[0] == number[1]) {
        return `1${numberToString(number[1])}${Math.max(patternToNumber(pattern[0]), patternToNumber(pattern[1]))}`;
    }
    // ABBCD
    if (number[1] == number[2]) {
        return `1${numberToString(number[2])}${Math.max(patternToNumber(pattern[1]), patternToNumber(pattern[2]))}`;
    }
    // ABCCD
    if (number[2] == number[3]) {
        return `1${numberToString(number[3])}${Math.max(patternToNumber(pattern[2]), patternToNumber(pattern[3]))}`;
    }
    // ABCDD
    if (number[3] == number[4]) {
        return `1${numberToString(number[4])}${Math.max(patternToNumber(pattern[3]), patternToNumber(pattern[4]))}`;
    }

    // NONE = -1
    return `-1`;
}

// SPADE = 4, DIAMOND = 3, HEART = 2, CLOVER = 1
function patternToNumber(pattern) {
    if (pattern == 'SPADE') {
        return 4;
    } else if (pattern == 'DIAMOND') {
        return 3;
    } else if (pattern = 'HEART') {
        return 2;
    } else {
        return 1;
    }
}

function numberToString(n) {
    if ( n <= 9 ) {
        return `0${n}`;
    } else {
        return n;
    }
}

function cardToNumber(card) {
    let front = card.split('_')[0];
    
    if (front == 'JACK') {
        front = 11;
    } else if (front == 'QUEEN') {
        front = 12;
    } else if (front == 'KING') {
        front = 13;
    } else if (front == 'A') {
        front = 14;
    }

    front = parseInt(front);
    return front;
}

function cardToPattern(card) {
    let back = card.split('_')[1];
    if (back == 'DUMMY') return [];
    return back;
}

function cardPower(card) {
    return `${ cardToNumber(card) }${ patternToNumber(cardToPattern(card)) }`;
}

function combinationPower(array) {
    let target = [
        [0, 1, 2, 3, 4],
        [0, 1, 2, 3, 5],
        [0, 1, 2, 3, 6],
        [0, 1, 2, 4, 5],
        [0, 1, 2, 4, 6],
        [0, 1, 2, 5, 6],
        [0, 1, 3, 4, 5],
        [0, 1, 3, 4, 6],
        [0, 1, 3, 5, 6],
        [0, 1, 4, 5, 6],
        [0, 2, 3, 4, 5],
        [0, 2, 3, 4, 6],
        [0, 2, 3, 5, 6],
        [0, 2, 4, 5, 6],
        [0, 3, 4, 5, 6],
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 6],
        [1, 2, 3, 5, 6],
        [1, 2, 4, 5, 6],
        [1, 3, 4, 5, 6],
        [2, 3, 4, 5, 6]
    ];

    let arr = [];
    for (let i = 0; i < target.length; i++) {
        let targetnum = target[i];

        let select = [];
        for (let j = 0; j < targetnum.length; j++) {
            select.push(array[targetnum[j]]);
        }
        arr.push( checkcards(select) );
    }
    console.log(arr);
    return Math.max(...arr);
}