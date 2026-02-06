export const formatGameDate = (dateString) => 
{
  // Extracts YYYY-MM-DD from the datetime string
  const datePart = dateString.split('T')[0] || dateString.split(' ')[0];
  const [year, month, day] = datePart.split('-');
  
  return `${month}-${day}-${year}`;
};