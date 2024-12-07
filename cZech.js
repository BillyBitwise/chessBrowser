/************************************************************************************************/
/*  Author:  Jimmy Styles                                                                       */
/*  Support: Bludoid                                                                            */
/*  Date:    Sept 22/24 - Nov 30/24                                                             */
/*                                                                                              */
/*  Audio:   https://pixabay.com/sound-effects/error-126627/                                    */
/*           https://pixabay.com/sound-effects/knocking-on-the-board-158172/                    */
/*           https://pixabay.com/sound-effects/success-fanfare-trumpets-6185/                   */
/*                                                                                              */
/*  Images:  https://commons.wikimedia.org/wiki/Category:PNG_chess_pieces/Standard_transparent  */
/*                                                                                              */
/************************************************************************************************/

const squareArr=  [ true,
                    "br", "bn", "bb", "bq", "bk", "bb", "bn", "br",
                    "bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp",
                            "", "", "", "", "", "", "", "",
                            "", "", "", "", "", "", "", "",
                            "", "", "", "", "", "", "", "",
                            "", "", "", "", "", "", "", "",
                    "wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp",
                    "wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr" ];


function Lionel()       { console.log("Hello! Is it me you're looking for?");}
function getId(ele)     { return document.getElementById(ele);}
function setWidth(pxls) { r.style.setProperty('--sqWidth', pxls)}       // changes CSS variable in :root 
function setColumns(c)  { r.style.setProperty('--columns', c)}          // changes CSS variable in :root
function rank(num)      { return 9-(Math.ceil(num/8));}
function file(num)      { return num%8? num%8: 8;}
function getId(ele)     { return document.getElementById(ele);}
function bgColour(ele, colour)  { ele.style= (colour=="white") ?"background:white" :"background:grey";}

let currentPlayer=  () => getId('board').dataset.player.charAt(0);
let opponent=       () => currentPlayer()== 'w'? 'b': 'w';
let playerAt=       (where) => squareArr[where].charAt(0);
let pieceAt=        (where) => squareArr[where].charAt(1);

const moves=[];
const columns=  8;
const wPassant= {'where':0, 'move':0, 'passant':false};
const bPassant= {'where':0, 'move':0, 'passant':false};
const promote=  {from:0,  to:0};
const wCastle=  {61:true, 64:true, 57:false};
const bCastle=  {king:5,  short:8,  long:1,};
const r = document.querySelector(':root');
const rs = getComputedStyle(r);

const castle = {    // properties with numeric keys represent rook and king squares, values represent whether they have ever moved
    1: false,   57: false,
    5: false,   61: false,
    8: false,   64: false,

    isRook(square)          {return Object.hasOwn(this, square);},
    hasPieceMoved(square)   {return this[square];},
    recordMove(square)      {this[square] = true;},
};

function printBoard(cols){
// build board element with 64 child square elements
// initialize player and round in board element
// declare a 'click event' for each square element
    
    const board=getId("board");
    board.setAttribute('data-player', 'white');
    let i=1;
    let row=1;

    board.innerHTML="";
    while(i <= cols**2){
        const square = document.createElement("div");
        square.classList="square";
        square.id=i;
        if(row%2){  // odd ranks start white then black
            if(i%2) { bgColour(square, "white");}
            else    { bgColour(square, "black");}
        }
        else{       // even ranks start black then white
            if(i%2) { bgColour(square, "black");}
            else    { bgColour(square, "white");}
        }

        square.addEventListener("click", clickEvent)
        board.appendChild(square);
        
        if (!(i%cols)){       // increment row and add break between ranks
            row++;
            board.appendChild(document.createElement("br"));
        }
        i++;  // next square
    }
    for(let i=1; i<=squareArr.length-1; i++)  { printSquare(i, squareArr[i]);}
    setMousePointer(getId("board").dataset.player);
    printPromote('w');
    printPromote('b');
}

//   fill divs above and below board with promotion pieces, then hide them
function printPromote(colour){

    const promote= ['n', 'b', 'r', 'q'];                // add colour parameter to each element makes a valid piece
    const bg= colour== 'w'? 'black': 'white';
    const parent= colour=='w'? 'wPromote': 'bPromote';  // ids for divs above and below the board
    
    for(let i=0; i< promote.length; i++){
        const square= document.createElement('div');
        const piece= colour + promote[i];               // form a valid piece for printSquare()

        square.classList= 'promotion';                  // using 'square' will interfere with querySelector(square) elsewhere
        square.id= piece;
        bgColour(square, bg);
        square.addEventListener('click', promotePawn);  // action taken for promotion choice
        getId(parent).appendChild(square);
        printSquare(square.id, square.id, parent)       // modify printSquare to receive 3rd parameter
    }
    getId('wPromote').style.visibility= 'hidden';
    getId('bPromote').style.visibility= 'hidden';
}

function promotePawn(){

    const squares= document.querySelectorAll('.square');
    squares.forEach(square => square.classList.remove('disabled'));     // enable board appearance back to original
    squareArr[promote.from] = this.id;                                  // change pawn to promotion piece before moving
    getId('wPromote').style.visibility= 'hidden';                       
    getId('bPromote').style.visibility= 'hidden';
    move(promote.from, promote.to, this.id);                            // call move with promotion piece (this.id)
}

// num= element id   // piece= image file  // set ele just for promotion otherwise empty
function printSquare(num, piece, ele){

    // remove element attributes, classes and innerHTML before reassigning them to squares containing a piece
    delete getId(num).dataset.pieceColour;
    delete getId(num).dataset.pieceType;
    getId(num).classList.remove("clicked");     // printing squares implies a square is no longer selected
    getId(num).innerHTML = "";    

    if(piece== ""){
        squareArr[num]= "";
        return;
    }
    
    // add image to squares containing a piece
    const pieceImg= document.createElement("img");
    pieceImg.src= "assets/images/" + piece + ".png";
    getId(num).appendChild(pieceImg);
    
    // add attributes to square and update array of squares     // formatting not necessary?????????? just store a single character
    const colour= formatColour(piece.charAt(0));
    const type= formatType(piece.charAt(1));
    getId(num).dataset.pieceColour= colour;
    getId(num).dataset.pieceType= type;
    if(ele=== undefined) {squareArr[num]=piece;}                // ele will be undefined for board squares, but defined for promotion squares
}

function clickEvent(){

    let found= 0;      // use as value and boolean
    let ValidMoves=[];
    const currentPlayer = getId('board').dataset.player.charAt(0);
    const thisClick = playerAt(this.id);

    let squares= document.querySelectorAll(".square");
    for(let i=0; i < squares.length; i++){
        if(squares[i].classList.contains("clicked")) { found= i+1;}
    }
    // if(!found && currentPlayer==thisClick) {validMoves=validMove(Number(this.id));}
    
    if((thisClick != currentPlayer))
        if(!found)     // your first click and not your own piece
            {return;}
        else{           // your second click and not your own piece
            move(found, Number(this.id), squareArr[found]);
            return;            
        }           

    if(!found || this.id == found)              // either first click OR second click is same as first
        { this.classList.toggle("clicked");}
    if(found && this.id != found){              // your second click is your own piece... therefore selection change
        getId(found).classList.toggle("clicked");
        this.classList.toggle("clicked");

    }
}

function move(from, to, piece){

    let valid;
    if(promote.from){       // skip move validation if we are promoting
        promote.from=0;
        promote.to=0;
        valid=true;         // promotion piece from penultimate rank could defy validation, eg.. pawn pushes forward and promotes to bishop
    }
    else {valid= validMove(from, to, piece);}  // no promotion, run validation process

    if(!valid){
        soundAlert('invalid');
        return;
    }

    // check from pawn promoting
    if( pieceAt(from)=='p' && (rank(to)==8 || rank(to)==1) ){
        getId(playerAt(from) + 'Promote').style.visibility= 'visible';      // make promotion pieces visible
        const squares= document.querySelectorAll('.square');
        squares.forEach(square => square.classList.add('disabled'));        // provide a disabled look to board during promotion selection
        promote.from= from;     //record source and target squares for the promotePawn EVENTLISTENER
        promote.to= to;
        return;
    }

    printSquare(from, "");
    printSquare(to, piece);

    // passant requires explicit removal of defender, unlike every other attack
    if(getId('board').dataset.player== 'black'){
        if(bPassant.move== moves.length-1 && bPassant.passant== true){      // is black passant current
            printSquare(bPassant.where, "");
            bPassant.where=0; bPassant.move=0; bPassant.passant= false;
        }
    }    
    // passant requires explicit removal of defender, unlike every other attack
    if(getId('board').dataset.player=='white'){                              
        if(wPassant.move== moves.length-1 && wPassant.passant== true){      // is white passant current
            printSquare(wPassant.where, "");
            wPassant.where=0; wPassant.move=0; wPassant.passant= false;
        }
    }
    
    if(piece.charAt(1)== 'k' && Math.abs(from-to)==2){      // has the king Castled
        if(piece.charAt(0)== 'w'){
            if(to==59){                                     // long castle white
                printSquare(57, '');
                printSquare(60, 'wr');
            }
            if(to==63){                                     // short castle white
                printSquare(64,'');
                printSquare(62, 'wr');
            }
        }else{
            if(to==3){                                      // long castle black
                printSquare(1, '');
                printSquare(4, 'br');
            }
            if(to==7){                                      // short castle black
                printSquare(8, '');
                printSquare(6, 'br');
            }
        }
    }

    soundAlert('valid');
    moves.push({'piece':pieceAt(to), 'rank':rank(to), 'file':file(to)});     // record moves, especially for passant sake
    getId('board').dataset.player= getId('board').dataset.player=== 'white'? 'black': 'white';  // change player
    setMousePointer(getId('board').dataset.player);

    // const check= isCheck(to);
}

function formatColour(colour){
    const colours= {'w': 'white', 'b': 'black'};
    return colours[colour] || '';
}

function formatType(type){
    const types= {
        'p': 'pawn',
        'r': 'rook',
        'n': 'knight',
        'b': 'bishop',
        'q': 'queen',
        'k': 'king'
    };
    return types[type] || '';
}

function setMousePointer(colour){
    const squares= document.querySelectorAll('.square');
    squares.forEach(square => {
        square.addEventListener('mouseenter', () =>{
            if(square.getAttribute('data-piece-colour') == colour)
                {square.classList.add('current-player-pointer');}
            else{ square.classList.remove('current-player-pointer');}
        });
        square.addEventListener('mouseleave', () => {
            square.classList.remove('current-player-pointer');
        });
    });
}

function soundAlert(soundType){
    
    switch(soundType){
        case 'invalid':
            const invalidMoveSound= new Audio('assets/sounds/invalidMove.mp3');
            invalidMoveSound.volume=0.4;
            invalidMoveSound.currentTime= 0.500;
            invalidMoveSound.play();
            console.log("Not a valid move");
            break;

        case 'valid':
            const validMoveSound= new Audio('assets/sounds/validMove.mp3');
            validMoveSound.volume= 0.3;
            validMoveSound.play();
            break;

        case 'check':
            const checkSound= new Audio('assets/sounds/check.mp3');
            checkSound.volume= 0.3;
            checkSound.play();
            break;

        default:    break;
    }
}

function validPawn(from, to){
    
    let valid= false;
    if(playerAt(from) =='w'){

        if( (from-to== 7 && from%8 !=0 && playerAt(to)== 'b') ||    // white attacks black NorthWest or NorthEast
            (from-to== 9 && from%8 !=1 && playerAt(to)== 'b'))
            {valid= true;}
        if(from-to== 8  && playerAt(to)== '')                       // white pushes one
            {valid= true;}
        if(from-to== 16 && playerAt(to)== '' && playerAt(from-8)== '' && rank(from)== 2){   // white pushes two
            valid= true;
            if( (playerAt(to-1)== 'b' && from%8 !=1) ||         // is en passant possible having pushed two
                (playerAt(to+1)== 'b' && from%8 !=0)){
                    bPassant.where= to;
                    bPassant.move= moves.length;
                    bPassant.passant= false;
                }
        }
        if( (from-to== 7 && from%8 !=0 && rank(from)== 5                        // white wants en passant to the right
            && wPassant.where== from+1 && wPassant.move==moves.length-1)){      // and black made it possible last move 
                valid=true;
                wPassant.passant=true;
        }
        if( (from-to== 9 && from%8 !=1 && rank(from)== 5                        // white wants en passant to the left
            && wPassant.where== from-1 && wPassant.move==moves.length-1)){      // and black made it possible last move 
                valid=true;
                wPassant.passant=true;
        }
    }
    else
    {
        if( (from-to== -7 && from%8 !=1 && playerAt(to)== 'w') ||   // black attacks white left or right
            (from-to== -9 && from%8 !=0 && playerAt(to)== 'w'))
            {valid= true;}
        if(from-to== -8  && playerAt(to)== '')                      // black pushes one
            {valid= true;}
        if(from-to== -16 && playerAt(to)== '' && playerAt(from+8)== '' && rank(from)== 7){      // white pushes two
            valid= true;
            if( (playerAt(to-1)== 'w' && from%8 !=1) ||         // is en passant possible having pushed two
                (playerAt(to+1)== 'w' && from%8 !=0)){
                    wPassant.where= to;
                    wPassant.move= moves.length;
                    wPassant.passant= false;
                }
        }
        if( (from-to== -7 && from%8 !=1 && rank(from)== 4                   // black wants en passant to the left
            && bPassant.where== from-1 && bPassant.move==moves.length-1)){  // and white made it possible last move
                valid=true;
                bPassant.passant=true;
        }
        if( (from-to== -9 && from%8 !=0 && rank(from)== 4                   // black wants en passant to the right
            && bPassant.where== from+1 && bPassant.move==moves.length-1)){  // and white made it possible last move
                valid=true;
                bPassant.passant=true;
        }
    }
    return valid;    
}

function validRook(from, to){        // probably don't need to check if to is empty
        
    if(file(from)== file(to)){                                  // moving North or South
        if(from > to){
            for(let path= from-8; path>= to+8; path-=8){        // scan North between from and to
                if(pieceAt(path)!= '') {return false;}
            }
            if((pieceAt(to)=='') || (playerAt(from)!= playerAt(to))) {return true;}     // is target empty or occupied by opponent
            else {return false;}
        }
        else{
            for(let path= from+8; path<= to-8; path+=8){        // scan South between from and to
                if(pieceAt(path)!= '') {return false;}
            }
            if((pieceAt(to)=='') || (playerAt(from)!= playerAt(to))) {return true;}     // is target empty or occupied by opponent
            else {return false;}
        }
    }

    if(rank(from)== rank(to)){                                  // moving East or West
        if(from > to){                                          
            for(let path= from-1; path>= to+1; path--){         // scan West between from and to
                if(pieceAt(path)!= '') {return false;}
            }
            if((pieceAt(to)=='') || (playerAt(from)!= playerAt(to))) {return true;}     // is target empty or occupied by opponent 
            else {return false;}
        }
        else{
            for(let path= from+1; path<= to-1; path++){         // scan East between from and to
                if(pieceAt(path)!= '') {return false;}
            }
            if((pieceAt(to)=='') || (playerAt(from)!= playerAt(to))) {return true;}     // is target empty or occupied by opponent
            else {return false;}
        }
    }
    return false;  
}

function validBishop(from, to){      // probably don't need to check if to is empty

    if(from %9 == to %9){                                       // moving NorthWest or SouthEast
        if(from> to && file(from)!= 1){       
            for(let path= from-9; path>= to+9; path -=9){       // scan NorthWest between from and to
                if(pieceAt(path)!= '') return false;
                if(file(path)== 1 && path!= to) {return false;} // border reached, stop scanning
            }
            if(pieceAt(to)== '' || playerAt(from)!= playerAt(to)) {return true;}    // is target empty or occupied by opponent
        }
        if(from< to && file(from)!= 8){
            for(let path= from+9; path<= to-9; path +=9){       // scan SouthEast between from and to
                if(pieceAt(path)!= '') {return false;}
                if(file(path)== 8 && path!= to) {return false;} // border reached, stop scanning
            }
            if(pieceAt(to)== '' || playerAt(from)!= playerAt(to)) {return true;}    // is target empty or occupied by opponent
        }               
    }

    if(from %7 == to %7){                                       // moving NorthEast or SouthWest
        if(from> to && file(from)!= 8){
            for(let path= from-7; path>= to+7; path -=7){       // scan NorthEast between from and to
                if(pieceAt(path)!= '') {return false;}
                if(file(path)== 8 && path!= to) {return false;} // border reached, stop scanning
            }
            if(pieceAt(to)== '' || playerAt(from)!= playerAt(to)) {return true;}    // is target empty or occupied by opponent
        }
        if(from< to && file(from)!= 1){
            for(let path= from+7; path<= to-7; path +=7){       // scan SouthWest between from and to
                if(pieceAt(path)!= '') {return false;}
                if(file(path)== 1 && path!= to) {return false;} // border reached, stop scanning
            }
            if(pieceAt(to)== '' || playerAt(from)!= playerAt(to)) {return true;}    // is target empty or occupied by opponent
        }
    }
    return false;
}

function validKnight(from, to){

    const target= Math.abs(from-to);      // scan target squares only,  6,-6, 10,-10, 15,-15, 17,-17
    switch(target){                       // knight hops, no actual path
        case 6:    
        case 10:
        case 15:
        case 17:
            if(getId(from).style.background == getId(to).style.background)  {return false;} // knight moves to opposite square colour only
            if(pieceAt(to)== '' || playerAt(from) != playerAt(to))   {return true;}         // is target empty or occupied by opponent
            break;
        default:    return false;
    }
}    

function validQueen(from, to){       // Queen mimics bishop and rook validation
    if(validBishop(from, to) || validRook(from, to))    {return true;}
    return false;
}

function validKing(from, to){

    // DELETE OPPONENTCOLOUR CONST AND SUBSTITURE WITH opponent()

    const path= Math.abs(from-to);
    const opponentColour= playerAt(from)== 'w'? 'b': 'w';
    const target= [1, -1, 7, -7, 8, -8, 9, -9];           // scan targets only, no actual path

    switch(path){
        case 1:    
        case 7:
        case 8:
        case 9: if(pieceAt(to)== '' || playerAt(from) != playerAt(to)){     // is target empty or occupied by opponent
                    for(let path of target) {
                        if(to+path >=1 && to+path <=64){                    // prevent breach of North and South border
                            if( Math.abs(file(from) - file(to)) >1) return false;
                            if(Math.abs(file(to+path) - file(from)) <3){    // breach border East or West creates file gap greater than 2
                                if(squareArr[to+path]== opponentColour + 'k') return false;     // adjacent Kings not allowed 
                            }
                            
                        }
                    }
                    return true;
                }
                break;

            case 2: if((from==5 && !castle.hasPieceMoved(5)) || (from==61) && !castle.hasPieceMoved(61)){  // King and rook have not moved
                        if(from-to >0){     // long castle
                            if(!castle.hasPieceMoved(from-4)){              // long Rook has not moved
                                const cloneSquareArr= [...squareArr];       // clone array for isInCheck function
                                for(let i=0; i<3; i++){                     // check vacancy for 3 squares
                                    if( (cloneSquareArr[from-i] != '' && i!= 0)     // squares between king and rook not empty (except king square)
                                        || isInCheck(from-i, opponent(), cloneSquareArr)){  // OR squares under attack
                                        return false;       // failed condition above
                                    }
                                }
                            }
                        }else{      // short castle
                            if(!castle.hasPieceMoved(from+3)){                  // short Rook has not moved         
                                const cloneSquareArr= [...squareArr];           // clone array for isInCheck function
                                for(let i=0; i<3; i++){                         // check vacancy for 3 squares
                                    if( (cloneSquareArr[from+i] != '' && i!= 0)     // squares between king and rook not empty (except king square)
                                        || isInCheck(from+i, opponent(), cloneSquareArr)){  // OR squares under attack
                                        return false;       // failed condition above
                                    }
                                }
                            }
                        }
                        return true;        // castle range was vacant and free of attack - KING CASTLES
                    }else{return false;}    // King and Rook moved from starter square -KING CANT CASTLE


        default:    return false;
    }
}


function validMove(from, to, piece){

    let rtnVal;
    switch(pieceAt(from)){
        case 'p':   rtnVal = validPawn  (from, to); break;
        case 'r':   rtnVal = validRook  (from, to); break; 
        case 'k':   rtnVal = validKing  (from, to); break;
        case 'q':   rtnVal = validQueen (from, to); break;
        case 'b':   rtnVal = validBishop(from, to); break;
        case 'n':   rtnVal = validKnight(from, to); break;
        default:    console.log('Validate unknown piece'); break;
    }
    if(!rtnVal) return false;

    // copy square array, declare arguments for check function
    const cloneSquareArr = [...squareArr];
    cloneSquareArr[from]= '';
    cloneSquareArr[to]= piece;
    const currentPlayerKing= cloneSquareArr.indexOf(currentPlayer() +'k');
    const opponentKing = cloneSquareArr.indexOf(opponent() +'k');

    let selfCheck= isInCheck(currentPlayerKing, opponent(), cloneSquareArr);
    let check= isInCheck(opponentKing, currentPlayer(), cloneSquareArr);
    
    if(selfCheck){
        console.log("You can not place your king in peril");
        rtnVal= false;
    }
    else {rtnVal= true;}
    if(check && !selfCheck) {soundAlert('check')};

    if(from== 5) {castle.recordMove(1);  castle.recordMove(8);}     // black king moved, disable castle
    if(from==61) {castle.recordMove(57); castle.recordMove(64);}    // white king moved, disable castle
    if(castle.isRook(from))  {castle.recordMove(from);}             // rook moved, disable castle on this rook side

    return rtnVal;
}

function isInCheck(square, attackerColour, cloneSquareArr){      // scan attack lines using square as Point of Origin

    // console.table({ "defender content": cloneSquareArr[square],
    //                 "defending square": square,
    //                 "attacker colour":  attackerColour });

    let rtnVal= false;
    const checks= [];

    [   compassCheck(square, attackerColour, cloneSquareArr),
        knightCheck(square, attackerColour, cloneSquareArr),
        pawnCheck(square, attackerColour, cloneSquareArr)
    ]   .forEach( (rtn) => {if(rtn!== undefined) checks.push(rtn)} );
    
    console.log(`Returned to isInCheck: ${checks}`); 
    console.table(checks);

    // checks.forEach( (path) => { console.log(`attacker: ${path[path.length -1]}`)});
       


    if(checks.length) rtnVal=true;
    return rtnVal;
}

function compassCheck(square, attackerColour, cloneSquareArr ) {     // scan attack lines for Queen, Rook and Bishop
    
    let rtnVal= undefined;
    const checks=[];
    const attackLines = [
        // Array of objects containing an attacking piece, initializer, condition function, and incrementer for the nested loops below
        // first four elements dedicated to Rook and Queen lines, the last four are Bishop and Queen lines
        { piece: 'r', start: square + 8, condition: (path) => path <= 64, increment:  8 },                              // South
        { piece: 'r', start: square - 8, condition: (path) => path >= 1,  increment: -8 },                              // North
        { piece: 'r', start: square - 1, condition: (path) => rank(path) === rank(square), increment: -1 },             // West
        { piece: 'r', start: square + 1, condition: (path) => rank(path) === rank(square), increment:  1 },             // East
        { piece: 'b', start: square - 9, condition: (path) => path >= 1  && file(path) < file(square), increment: -9 }, // North-West
        { piece: 'b', start: square + 9, condition: (path) => path <= 64 && file(path) > file(square), increment: +9 }, // South-East
        { piece: 'b', start: square - 7, condition: (path) => path >= 1  && file(path) > file(square), increment: -7 }, // North-East
        { piece: 'b', start: square + 7, condition: (path) => path <= 64 && file(path) < file(square), increment: +7 }, // South-West
    ];

    for (let i = 0; i < attackLines.length; i++) {
        const checkLine= [];
        const { piece, start, condition, increment } = attackLines[i];          // annonymous object properties assigned from attackLines elements 
        for (let path = start; condition(path); path += increment) {            // annonymous object properties dictate for loop settings
            checkLine.push(path)
            if (cloneSquareArr[path] === '') continue;
            if (cloneSquareArr[path] === attackerColour + piece || cloneSquareArr[path] === attackerColour + 'q') {   // is attacker present
                // current player attacking, then check for check(s)
                checks.push(checkLine);
                if(attackerColour==currentPlayer()){
                    console.log(`Can the ${attackerColour + cloneSquareArr[path].charAt(1)} at ${path} be killed?
                                ${isInCheck(path,opponent(),cloneSquareArr)}`);
                }
                console.log(`Called from: ${attackerColour==currentPlayer()? 'check': 'self-check'}`);
                console.log(`Oh Oh... ${cloneSquareArr[square]} is in cZech  by the ${attackerColour + cloneSquareArr[path].charAt(1)}`);
                // console.log(`From CompassCheck ${checks}`);
                rtnVal= checks;
                break;
            }
            else {break;}       // non threatening piece found
        }
    }
    return rtnVal; // Could not find check, return false
}

function pawnCheck(square, attackerColour, cloneSquareArr){  //REVISED REVISED

    let rtnVal= undefined;
    const defender= cloneSquareArr[square].charAt(0);
    if(defender== 'w'){
        if(cloneSquareArr[square -7]== 'bp' && file(square) != 8)   rtnVal= [square-7];     // bp attacking wk from NE
        if(cloneSquareArr[square -9]== 'bp' && file(square) != 1)   rtnVal= [square-9];     // bp attacking wk from NW
    }
    if(defender=='b'){
        if(cloneSquareArr[square +7]== 'wp' && file(square) != 1)   rtnVal= [square+7];     // wp attacking bk from SW
        if(cloneSquareArr[square +9]== 'wp' && file(square) != 8)   rtnVal= [square+9];     // wp attacking bk from SE
    }
    if(rtnVal!== undefined) console.log(`Oh Oh... ${cloneSquareArr[square]} is in cZech by the ${rtnVal< square? 'bp': 'wp'}`);
    return rtnVal;
}

function knightCheck(square, attackerColour, cloneSquareArr){             // scan hops of the knight

    let rtnVal= undefined;
    const attackLines = [6, -6, 10, -10, 15, -15, 17, -17];     // hops measure the distance between king and knight
    for(let path of attackLines){
        const knightAt= square + path;
        if(knightAt >=1 && knightAt <=64){                      //prevent breach of border North and South
            if(getId(square).style.background != getId(knightAt).style.background){     // knight moves to opposite square colour
                if(cloneSquareArr[knightAt]== attackerColour + 'n'){                         // attacking knight found
                    console.log(`Oh Oh... ${cloneSquareArr[square]} is in cZech by the ${attackerColour + cloneSquareArr[knightAt].charAt(1)}`);
                    return [knightAt];                    
                }
            }
        }
    }
    return rtnVal;
}

// ************ Executable Code **************** //
// ********************************************* //

Lionel();
setWidth("60px");
setColumns(columns);
printBoard(columns);