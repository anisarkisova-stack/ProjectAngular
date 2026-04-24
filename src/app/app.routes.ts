import { Routes } from '@angular/router';
import { Main } from './main/main';
import { TrainFind } from './train-find/train-find';
import { Component } from '@angular/core';
import { Booking } from './booking/booking';
import { Register } from './register/register';
import { Invois } from './invois/invois';
import { TicketCheck } from './ticket-check/ticket-check';
import { authGuard } from './auth/auth-guard';
import { Profile } from './auth/profile/profile';
import { Auth } from './auth/auth/auth';

export const routes: Routes = [
   {
        path: "",
        component: Main,
    },
    {
        path: "train-find",
        component: TrainFind,
    },
    {
        path:"booking",
        component:Booking,

    },
    {
        path:"register",
        component:Register,

    },
    {
        path:"invois",
        component:Invois,

    },
    {
    path: 'ticket-check',
    component: TicketCheck,
  },
   {
        path:"auth", 
        component:Auth,
    }, 
    {
        path:"profile", 
        component:Profile, 
        canActivate:[authGuard]
    },
        
    


    
    
];
