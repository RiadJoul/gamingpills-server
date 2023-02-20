export const validatePassword = (password: string) => {
  if (password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)) return true; //Minimum eight characters, at least one letter and one number

  return false;
};
