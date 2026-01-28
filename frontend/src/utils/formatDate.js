export const formatGameDate = (dateString) => {
  const date = new Date(dateString);
  
  // Just show the date in MM-DD-YYYY format
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate() - 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}-${day}-${year}`;
};