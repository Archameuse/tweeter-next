export default function getUsername(user: User): string {
  if (!user.username) return "Unknown user";
  // if(!user.firstName || !user.lastName) return 'Unknown user';
  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  // const firstName = user.firstName.toLowerCase()
  // const lastName = user.lastName.toLowerCase()
  // return capitalize(firstName) + ' ' + capitalize(lastName)
  return capitalize(user.username);
}
