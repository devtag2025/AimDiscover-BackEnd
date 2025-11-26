export function shortenForMeshy(text, maxLength = 800) {
  if (!text) return "";
  
  if (text.length <= maxLength) {
    return text;
  }

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let shortened = "";
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if ((shortened + trimmed).length <= maxLength - 3) {
      shortened += (shortened ? ". " : "") + trimmed;
    } else {
      break;
    }
  }

  return shortened || text.substring(0, maxLength - 3) + "...";
}
