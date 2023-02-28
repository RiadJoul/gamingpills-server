export const validatePassword = (password: string) => {
  //Minimum eight characters
  if (password.length >= 8) {
    return true;
  }
  
  return false;
};