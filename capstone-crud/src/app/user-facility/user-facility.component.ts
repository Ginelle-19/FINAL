import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-facility',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxPaginationModule, MatIconModule],
  templateUrl: './user-facility.component.html',
  styleUrl: './user-facility.component.css',
  providers: [DatePipe]
})
export class UserFacilityComponent {
  FacilityArray: any[] = [];
  RoomsArray: any[] = [];
  isResultLoaded = false;
  p: number = 1;
  itemsPerPage: number = 10;

  DateAvailable: Date | null = null;

  constructor(private http: HttpClient, private datePipe: DatePipe) {
    this.getAllFacilities();
  }

  adjustTimeZone(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return empty string if value is null or undefined
    }
    const dateValue = new Date(value);
    // Get the timezone offset in milliseconds and adjust the date
    const offsetDate = new Date(dateValue.getTime() - dateValue.getTimezoneOffset() * 60000);
    return this.datePipe.transform(offsetDate, 'yyyy-MM-dd h:mm a', 'Asia/Manila') || '';
  }
  

  getAllFacilities() {
    this.http
    .get('https://ccjeflabsolutions.online:3000/api/room')
    .subscribe((resultData: any) => {
      this.isResultLoaded = true;
      // Format the date before assigning it to RoomsArray
      this.RoomsArray = resultData.data.map((room: any) => ({
        ...room,
        DateAvailable: this.adjustTimeZone(room.DateAvailable),
      }));
    });
  }

  refreshTable(): void{
    this.getAllFacilities();
  }
}