import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { interval } from 'rxjs';

@Component({
  selector: 'app-facility-crud',
  templateUrl: './facility-crud.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule,
    MatIconModule,
  ],
  styleUrls: ['./facility-crud.component.css'],
  standalone: true,
  providers: [DatePipe],
})
export class FacilityCrudComponent {
  FacilityArray: any[] = [];
  RoomsArray: any[] = [];
  isResultLoaded = false;
  isUpdateFormActive = false;

  RoomName: string = '';
  RoomDesc: string = '';
  RoomStatus!: number;
  RoomID: string | null = null;
  DateAvailable: Date | null = null;
  currentRoom: any;

  p: number = 1;
  itemsPerPage: number = 7;

  currentDate: Date = new Date();


  constructor(private http: HttpClient, private datePipe: DatePipe) {
    this.getAllRooms();
  }

  adjustTimeZone(value: string): string {
    // Get the current timezone offset in milliseconds
    const offset = new Date().getTimezoneOffset() * 60000; // Convert minutes to milliseconds
    
    // Parse the input value into a Date object
    const dateValue = new Date(value);
    
    // Adjust the date by adding the timezone offset
    const offsetDate = new Date(dateValue.valueOf() + offset);
  
    // Format the adjusted date to display in the desired timezone
    return this.datePipe.transform(offsetDate, 'yyyy-MM-dd h:mm a', 'Asia/Manila') || '';
  }
  
  
  ngOnInit(): void {
    // Update current date and time every second
    interval(1000).subscribe(() => {
      this.currentDate = new Date();
    });
  }
  
  getAllRooms() {
    this.http
      .get('https://ccjeflabsolutions.online:3000/api/room')
      .subscribe((resultData: any) => {
        this.isResultLoaded = true;
        this.RoomsArray = resultData.data;
      });
  }

  validateInputs():boolean{
    return(
      this.RoomName !== '' &&
      this.RoomDesc !== ''
    );
  }

  addRooms() {

    if (this.checkDuplicateCourse(this.RoomName, this.RoomDesc)) {
      alert('Course with the same code and name already exists.');
      return; // Do not proceed further
    }


    if (this.validateInputs()) {
    let bodyData = {
      RoomName: this.RoomName,
      RoomDesc: this.RoomDesc,
      DateAvailable: null
    };

    this.http
      .post('https://ccjeflabsolutions.online:3000/api/room/add', bodyData)
      .subscribe((resultData: any) => {
        alert('Room Added Successfully!');
        this.getAllRooms();
      });
    this.clearInputs();
    }
  }

  setUpdate(data: any) {
    this.RoomName = data.RoomName;
    this.RoomDesc = data.RoomDesc;
    this.RoomStatus = data.RoomStatus;
    this.DateAvailable = data.DateAvailable;
    this.RoomID = data.RoomID;
  }

  UpdateRecords(data: any) {
    let bodyData = {
      RoomName: data.RoomName,
      RoomDesc: data.RoomDesc,
      RoomStatus: data.RoomStatus,
      DateAvailable: data.DateAvailable,
      RoomID: data.RoomID,
    };

    this.http
      .put(
        'https://ccjeflabsolutions.online:3000/api/room/update' + '/' + data.RoomID,
        bodyData
      )
      .subscribe((resultData: any) => {
        alert('Room Updated Successfully!');
        this.getAllRooms();
      });
    this.clearInputs();
  }

  toggleActive(data: any) {
    if (data && data.RoomStatus !== undefined) {
      data.RoomStatus = data.RoomStatus === 1 ? 0 : 1;
      this.UpdateRecords(data);
    } else {
      console.error(
        'currentRoom is undefined or does not have an RoomStatus property'
      );
    }
  }

  save() {
    if (this.RoomID && this.RoomID !== '') {
      const roomData = {
        RoomName: this.RoomName,
        RoomDesc: this.RoomDesc,
        RoomStatus: this.RoomStatus,
        DateAvailable: this.DateAvailable,
        RoomID: this.RoomID,
      };
      this.UpdateRecords(roomData);
    } else {
      this.addRooms();
    }
    this.clearInputs();
  }

  clearInputs() {
    this.RoomName = '';
    this.RoomDesc = '';
    this.DateAvailable = null
  }

  deleteRoom(room: any) {
    const confirmation = window.confirm(
      'Are you sure you want to delete this record?'
    );

    if (confirmation) {
      this.http
        .delete('https://ccjeflabsolutions.online:3000/api/room/delete/' + room.RoomID)
        .subscribe(
          (resultData: any) => {
            alert('Record Deleted');
            this.getAllRooms();
          },
          (error) => {
            console.error('Error deleting room:', error);
            alert('Failed to delete room. Please try again later.');
          }
        );
    }
  }
  checkDuplicateCourse(roomName: string, roomDesc: string): boolean {
    // Convert course code and name to lowercase for case-insensitive comparison
    const lowerCaseCode = roomName.trim().toLowerCase();
    const lowerCaseName = roomDesc.trim().toLowerCase();
  
    // Check if any existing course has the same code and name
    return this.RoomsArray.some(room => {
      return room.RoomName.trim().toLowerCase() === lowerCaseCode &&
             room.RoomDesc.trim().toLowerCase() === lowerCaseName;
    });
  }
}