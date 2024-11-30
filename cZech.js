/************************************************************************************************/
/*  Author:  Jimmy Styles                                                                       */
/*  Support: Bludoid                                                                            */
/*  Date:    Sept 22/24 - Nov 30/24                                                                        */
/*                                                                                              */
/*  Audio:   https://pixabay.com/sound-effects/error-126627/                                    */
/*           https://pixabay.com/sound-effects/knocking-on-the-board-158172/                    */
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


let playerAt = (where) => squareArr[where].charAt(0);
let pieceAt = (where) => squareArr[where].charAt(1);

const moves=[];
const columns = 8;
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

    isCastlePiece(square)   {return Object.hasOwn(this, square);},
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
    else {valid= validMove(from, to);}  // no promotion, run validation process

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

    soundAlert('valid');
    moves.push({'piece':pieceAt(to), 'rank':rank(to), 'file':file(to)});     // record moves, especially for passant sake
    getId('board').dataset.player= getId('board').dataset.player=== 'white'? 'black': 'white';  // change player
    setMousePointer(getId('board').dataset.player);

    const check= isCheck(to);
}

// validation functions found in './logic.js'
function validMove(from, to){

    switch(pieceAt(from)){
        case 'p':   return validPawn  (from, to);
        case 'r':   return validRook  (from, to);
        case 'k':   return validKing  (from, to);
        case 'q':   return validQueen (from, to);
        case 'b':   return validBishop(from, to);
        case 'n':   return validKnight(from, to);
        default:    console.log('Validate unknown piece');
    }
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
        
    if(castle.isCastlePiece(from))  {castle.recordMove(from);}  // record the rook move for castling reference
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
        if(from> to){       
            for(let path= from-9; path>= to+9; path -=9){       // scan NorthWest between from and to
                if(pieceAt(path)!= '') {return false;}
                if(file(path)== 1 && path!= to) {return false;} // border reached, stop scanning
            }
            if(pieceAt(to)== '' || playerAt(from)!= playerAt(to)) {return true;}    // is target empty or occupied by opponent
        }
        else{
            for(let path= from+9; path<= to-9; path +=9){       // scan SouthEast between from and to
                if(pieceAt(path)!= '') {return false;}
                if(file(path)== 8 && path!= to) {return false;} // border reached, stop scanning
            }
            if(pieceAt(to)== '' || playerAt(from)!= playerAt(to)) {return true;}    // is target empty or occupied by opponent
        }               
    }

    if(from %7 == to %7){                                       // moving NorthEast or SouthWest
        if(from> to){
            for(let path= from-7; path>= to+7; path -=7){       // scan NorthEast between from and to
                if(pieceAt(path)!= '') {return false;}
                if(file(path)== 8 && path!= to) {return false;} // border reached, stop scanning
            }
            if(pieceAt(to)== '' || playerAt(from)!= playerAt(to)) {return true;}    // is target empty or occupied by opponent
        }
        else{
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

    const path= Math.abs(from-to);
    const opponentColour= playerAt(from)== 'w'? 'b': 'w';
    const target= [1, -1, 7, -7, 8, -8, 9, -9];           // scan targets only, no actual path

    if(castle.isCastlePiece(from))  {castle.recordMove(from);}
    switch(path){
        case 1:    
        case 7:
        case 8:
        case 9: if(pieceAt(to)== '' || playerAt(from) != playerAt(to)){     // is target empty or occupied by opponent
                    for(let path of target) {
                        if(to+path >=1 && to+path <=64){                    // prevent breach of North and South border
                            if(Math.abs(file(to+path) - file(from)) <3){    // breach border East or West creates file gap greater than 2
                                if(squareArr[to+path]== opponentColour + 'k') return false;     // adjacent Kings not allowed 
                            }
                        }
                    }
                    return true;
                }
                break;
        case 2: return false;   // King castles

        default:    return false;
    }
}

function isCheck(attacker){      // scan attack lines using King as Point of Origin

    const king= playerAt(attacker)== 'w'? 'bk': 'wk';
    const kingAt= squareArr.indexOf(king);
    const attackerColour= playerAt(attacker);

    if(compassCheck(attacker, king, kingAt, attackerColour)) return true;
    if(knightCheck(king, kingAt, attackerColour)) return true;
    if(pawnCheck(king, kingAt, attackerColour)) return true;
    return false;
}

function compassCheck(attacker, king, kingAt, attackerColour) {     // scan attack lines for Queen, Rook and Bishop
    const attackLines = [
        // Array of objects containing an attacking piece, initializer, condition function, and incrementer for the nested loops below
        // first four elements dedicated to Rook and Queen lines
        { piece: 'r', start: kingAt + 8, condition: (path) => path <= 64, increment:  8 },                      // South
        { piece: 'r', start: kingAt - 8, condition: (path) => path >= 1,  increment: -8 },                      // North
        { piece: 'r', start: kingAt - 1, condition: (path) => rank(path) === rank(attacker), increment: -1 },   // West
        { piece: 'r', start: kingAt + 1, condition: (path) => rank(path) === rank(attacker), increment:  1 },   // East
        // next four elements dedicated to Bishop and Queen lines
        { piece: 'b', start: kingAt - 9, condition: (path) => path >= 10 && file(path) < file(kingAt), increment: -9 },   // North-West
        { piece: 'b', start: kingAt + 9, condition: (path) => path <= 55 && file(path) > file(kingAt), increment: +9 },   // South-East
        { piece: 'b', start: kingAt - 7, condition: (path) => path >= 9  && file(path) > file(kingAt), increment: -7 },   // North-East
        { piece: 'b', start: kingAt + 7, condition: (path) => path <= 56 && file(path) < file(kingAt), increment: +7 },   // South-West
    ];

    for (let i = 0; i < attackLines.length; i++) {
        const { piece, start, condition, increment } = attackLines[i];          // annonymous object properties assigned from attackLines elements 
        for (let path = start; condition(path); path += increment) {            // annonymous object properties dictate for loop settings
            if (squareArr[path] === '') continue;
            if (squareArr[path] === attackerColour + piece || squareArr[path] === attackerColour + 'q') {   // is attacker present
                console.log(`Oh Oh... ${king} is in cZech  by the ${attackerColour + pieceAt(path)}`);
                return true;
            }
            else {break;}       // non threatening piece found
        }
    }
    return false; // Could not find check, return false
}

function pawnCheck(king, kingAt, attackerColour){
    if(king== 'wk'  && ( (squareArr[kingAt -7]== 'bp' && file(kingAt) != 8 )
                    ||   (squareArr[kingAt -9]== 'bp' && file(kingAt) != 1))){    // are black pawns attacking white king from NE and NW
        console.log(`Oh Oh... ${king} is in cZech by the ${attackerColour + 'p'}`);        
        return true;
    }
    if(king=='bk' && ( (squareArr[kingAt +7]== 'wp' && file(kingAt) != 1)
                  ||   (squareArr[kingAt +9]== 'wp' && file(kingAt) != 8))){     // are white pawns attacking black king from SE and SW
        console.log(`Oh Oh... ${king} is in cZech by the ${attackerColour + 'p'}`);
       return true;
    }
}

function knightCheck(king, kingAt, attackerColour){             // scan hops of the knight

    const attackLines = [6, -6, 10, -10, 15, -15, 17, -17];     // hops measure the distance between king and knight
    for(let path of attackLines){
        const knightAt= kingAt + path;
        if(knightAt >=1 && knightAt <=64){                      //prevent breach of border North and South
            if(getId(kingAt).style.background != getId(knightAt).style.background){     // knight moves to opposite square colour
                if(squareArr[knightAt]== attackerColour + 'n'){                         // attacking knight found
                    console.log(`Oh Oh... ${king} is in cZech by the ${attackerColour + pieceAt(knightAt)}`);
                    return true;                    
                }
            }
        }
    }
    return false;
}

// ************ Executable Code **************** //
// ********************************************* //

Lionel();
setWidth("60px");
setColumns(columns);
printBoard(columns);