import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherHttpService } from '../../core/http/teacher-http.service';
import { ClassHttpService } from '../../core/http/class-http.service';
import { ClassDto } from '../../core/models/class.model';

@Component({
  selector: 'app-edit-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  template: `
    <h1>Edit teacher</h1>
    @if (loaded()) {
      <mat-card>
        <mat-card-content class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Full name</mat-label><input matInput [(ngModel)]="fullName"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="email"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Phone number</mat-label><input matInput [(ngModel)]="phoneNumber"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Assigned class</mat-label>
            <mat-select [(ngModel)]="classId">
              <mat-option [value]="null">None (unassigned)</mat-option>
              @for (c of classes(); track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="submit()">Save changes</button>
          <button mat-button (click)="cancel()">Cancel</button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.form-grid{grid-template-columns:1fr}}`]
})
export class EditTeacherComponent implements OnInit {
  private readonly svc = inject(TeacherHttpService);
  private readonly classSvc = inject(ClassHttpService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  @Input() id!: string;
  readonly loaded = signal(false);
  readonly classes = signal<ClassDto[]>([]);

  fullName = '';
  email = '';
  phoneNumber = '';
  classId: string | null = null;

  ngOnInit(): void {
    this.classSvc.getAll().subscribe(r => this.classes.set(r?.data ?? []));
    this.svc.getById(this.id).subscribe(r => {
      const t = r?.data;
      if (!t) return;
      this.fullName = t.fullName;
      this.email = t.email;
      this.phoneNumber = t.phoneNumber;
      this.classId = t.classId ?? null;
      this.loaded.set(true);
    });
  }

  async submit() {
    const r = await firstValueFrom(this.svc.update(this.id, {
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      classId: this.classId
    }));
    if (r?.success) {
      this.snack.open('Teacher updated', 'OK', { duration: 2500 });
      this.router.navigate(['/admin/teachers']);
    } else {
      this.snack.open(r?.message ?? 'Failed', 'OK', { duration: 4000 });
    }
  }

  cancel() { this.router.navigate(['/admin/teachers']); }
}
