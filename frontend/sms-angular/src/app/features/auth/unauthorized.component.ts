import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule],
  template: `
    <div class="wrapper">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Access denied</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>You do not have permission to access this page.</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-flat-button color="primary" [routerLink]="['/dashboard']">Go to dashboard</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .wrapper { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:16px; }
    .card { max-width:420px; }
  `]
})
export class UnauthorizedComponent {}
