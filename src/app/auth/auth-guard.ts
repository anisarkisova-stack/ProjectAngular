import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  let user = sessionStorage.getItem("user")
  if(user){
    return true
  }else{
    return false
  }
};
