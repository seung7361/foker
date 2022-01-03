function checkcards(stack) {
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
    if (n <= 9) {
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
    return `${cardToNumber(card)}${patternToNumber(cardToPattern(card))}`;
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
        arr.push(checkcards(select));
    }
    return Math.max(...arr);
}

const stack = [
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

function randomdeckmaker() {
    let copy = stack.slice();

    copy = shuffle(copy);

    let deck = new Array();
    for (let i = 0; i < 7; i++) {
        deck.push( copy.pop() );
    }

    return deck;
}


let result = new Array();
for (let i = 0; i < 13; i++) {
    result[i] = 0;
}

for (let i = 0; i < 100000; i++) {
    let mydeck = randomdeckmaker();
    let power = combinationPower(mydeck);
    // console.log(JSON.stringify(mydeck), power);


    if (power == -1) {
        result[0]++;
    } else if (power.toString().length == 4) {
        result[parseInt(power.toString().charAt(0))]++;
    } else if (power.toString().length == 5) {
        result[parseInt(power.toString().charAt(0)+power.toString().charAt(1))]++;
    }
}

console.table(result);