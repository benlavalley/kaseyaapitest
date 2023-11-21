
export default function genRandName()
{
	let text="";
	let alphabet="abcdefghijklmnopqrstuvwxyz"
	for(let i=0; i<10; i++)
		text +=alphabet.charAt(Math.floor(Math.random()*alphabet.length))
	return text;
}
