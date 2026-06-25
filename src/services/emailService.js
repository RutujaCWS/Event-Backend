export const sendEmail = async (to, subject, html) => {
  console.log(`📧 Email to ${to}: ${subject}`);
  console.log(`HTML: ${html}`);
  
  return true;
};