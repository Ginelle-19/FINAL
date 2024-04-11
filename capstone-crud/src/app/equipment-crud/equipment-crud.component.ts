
import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppComponent } from '../app.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConsumableCrudComponent } from '../consumable-crud/consumable-crud.component';
import { MatIconModule } from '@angular/material/icon';
// =============
import { CourseCrudComponent } from '../course-crud/course-crud.component';
import { DataService } from '../data.service';
// import { MatPaginatorModule} from '@angular/material/paginator';
import { DatePipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-equipment-crud',
  standalone: true,
  imports: [
    HttpClientModule,
    RouterOutlet,
    CommonModule,
    AppComponent,
    FormsModule,
    RouterModule,
    ConsumableCrudComponent,
    CourseCrudComponent,
    NgxPaginationModule,
    MatIconModule,
  ],
  providers: [HttpClientModule, DatePipe],
  templateUrl: './equipment-crud.component.html',
  styleUrl: './equipment-crud.component.css',
})
export class EquipmentCrudComponent {
  EquipmentArray: any[] = [];
  CourseArray: any[] = [];

  SelectedCourseID: number | null = null;

  searchValue: string = '';
  searchResult: any[] = [];

  isResultLoaded = false;
  isUpdateFormActive = false;

  currentID = '';
  EquipmentName: string = '';
  Quantity?: number;
  CourseID!: number;
  CalibrationSchedule: Date | null = null;

  minDate: string;

  p: number = 1;
  itemsPerPage: number = 7;

  isPDF: boolean = false; 

  @ViewChild('content') content!: ElementRef;
  public SavePDF(equipment: any[]): void {
    // Clone the HTML content of the table
    const content = this.content.nativeElement.cloneNode(true);
  
    // Remove action column if present
    const actionsColumnHeader = content.querySelector('th:last-child');
    if (actionsColumnHeader) {
      actionsColumnHeader.remove(); 
    }
  
    // Create a new jsPDF instance
    const doc = new jsPDF();
  
    // Add title and date
    const title = 'Equipment Report';
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    doc.text(title, 14, 10);
    doc.text(`Generated on: ${formattedDate}`, 14, 18);
  
    // Convert HTML content to array of data
    const data = this.extractTableData(content, equipment);
  
    // Generate PDF using jspdf-autotable
    autoTable(doc, {
      head: [['ID', 'Equipment Name', 'Quantity', 'Calibration Date']],
      body: data,
      startY: 30
    });
  
    // Save the PDF
    doc.save('Equipment.pdf');
  }
  
    
    // Helper method to extract table data from HTML content
    private extractTableData(content: HTMLElement, equipment: any[]): any[] {
      const data: any[] = [];
      const rows = content.querySelectorAll('tr');
    
      // Iterate over rows and extract cell data
      rows.forEach(row => {
        const rowData: any[] = [];
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          rowData.push(cell.textContent ?? ''); // Use empty string as default value if textContent is null
        });
        // Only add non-empty rows
        if (rowData.length > 0) {
          data.push(rowData);
        }
      });
    
      // Replace the first row with consumable data
      equipment.forEach((equipment, index) => {
        data[index] = [equipment.EquipmentID, equipment.EquipmentName, equipment.Quantity, equipment.CalibrationSchedule];
      });
    
      return data;
    }

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private datePipe: DatePipe,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.getAllEquipments();

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  getAllEquipments() {
    this.http
      .get('https://ccjeflabsolutions.online:3000/api/equipments/')
      .subscribe((resultData: any) => {
        this.isResultLoaded = true;
        this.EquipmentArray = resultData.data;
      });
  }

  validateInputs(): boolean {
    return (
      this.EquipmentName.trim() !== '' &&
      this.Quantity !== null &&
      this.Quantity !== undefined &&
      this.Quantity > 0 &&
      this.CourseID !== null
    );
  }

  register() {
    if (this.checkDuplicateCourse(this.EquipmentName)) {
      alert('Equipment with the same name already exists.');
      return; 
    }

    if (this.validateInputs()) {
    let bodyData = {
      EquipmentName: this.EquipmentName,
      Quantity: this.Quantity,
      CalibrationSchedule: this.datePipe.transform(
        this.CalibrationSchedule,
        'yyyy-MM-dd'
      ),
      CourseID: this.CourseID,
    };

    this.http
      .post('https://ccjeflabsolutions.online:3000/api/equipments/add', bodyData)
      .subscribe((resultData: any) => {
        alert('Equipment Added Successfully!');
        this.getAllEquipments();
      });
    this.clearInputs();
  }
}

  setUpdate(data: any) {
    this.EquipmentName = data.EquipmentName;
    this.Quantity = data.Quantity;
    this.CalibrationSchedule = data.CalibrationSchedule;
    this.CourseID = data.CourseID;
    this.currentID = data.EquipmentID;
  }

  UpdateRecords() {
    let bodyData = {
      EquipmentName: this.EquipmentName,
      Quantity: this.Quantity,
      CalibrationSchedule: this.datePipe.transform(
        this.CalibrationSchedule,
        'yyyy-MM-dd'
      ),
      CourseID: this.CourseID,
    };
    const editConfirmation = window.confirm(
      'Are you sure you want to update this record?'
    );

    if (editConfirmation) {
    this.http
      .put(
        'https://ccjeflabsolutions.online:3000/api/equipments/update' + '/' + this.currentID,
        bodyData
      )
      .subscribe((resultData: any) => {
        alert('Equipment Updated Successfully!');
        this.getAllEquipments();
      });
      this.clearInputs();
    }
  }

  save() {
    if (this.currentID == '') {
      this.register();
    } else {
      this.UpdateRecords();
    }
    this.clearInputs();
  }

  clearInputs() {
    this.EquipmentName = '';
    this.Quantity = 0;
    this.CourseID = 0;
    this.CalibrationSchedule = null;
  }

  setDelete(data: any) {
    const confirmation = window.confirm(
      'Are you sure you want to delete this record?'
    );

    if (confirmation) {
      this.http
        .delete(
          'https://ccjeflabsolutions.online:3000/api/equipments/delete' + '/' + data.EquipmentID
        )
        .subscribe(
          (resultData: any) => {
            alert('Record Deleted');
            this.getAllEquipments();
          },
          (error) => {
            console.error('Error deleting record: ', error);
          }
        );
    }
  }
  // get courses for dropdown
  loadCourses(): void {
    this.dataService.getCourses().subscribe(
      (response: any) => {
        this.CourseArray = response.data;
      },
      (error) => {
        console.error('Error fetching courses:', error);
      }
    );
  }

  filterEquipments(): void {
    if (this.SelectedCourseID !== null) {
      this.dataService.getEquipmentsByCourseId(this.SelectedCourseID).subscribe(
        (response: any) => {
          this.EquipmentArray = response.data;
        },
        (error) => {
          console.error('Error connecting to API: ', error);
        }
      );
    }
  }

  clearFilter(): void {
    this.SelectedCourseID = null;
    this.changeDetectorRef.detectChanges();
    this.filterEquipment();
  }

  filterEquipment(): void {
    if (this.SelectedCourseID !== null) {
      this.dataService
        .getConsumablesByCourseId(this.SelectedCourseID)
        .subscribe(
          (response: any) => {
            this.EquipmentArray = response.data;
          },
          (error) => {
            console.error('Error connecting to API: ', error);
          }
        );
    } else {
      // If SelectedCourseID is null, fetch all consumables
      this.http.get('https://ccjeflabsolutions.online:3000/api/equipments').subscribe(
        (response: any) => {
          this.EquipmentArray = response.data;
        },
        (error) => {
          console.error('Error connecting to API: ', error);
        }
      );
    }
  }

  assignCourse(): void {
    if (this.SelectedCourseID !== null) {
      this.dataService.getEquipmentsByCourseId(this.SelectedCourseID).subscribe(
        (response: any) => {
          this.EquipmentArray = response.data;
        },
        (error) => {
          console.error('Error connecting to API: ', error);
        }
      );
    }
  }

  searchEquipment() {
    if (this.searchValue.trim() !== '') {
      const searchTerm = this.searchValue.trim().toLowerCase();
      this.http.get('https://ccjeflabsolutions.online:3000/api/equipments').subscribe(
        (response: any) => {
          this.EquipmentArray = response.data.filter((equipment: any) =>
            equipment.EquipmentName.toLowerCase().includes(searchTerm)
          );
        },
        (error) => {
          console.error('Error searching equipment:', error);
        }
      );
    } else {
      this.getAllEquipments();
    }
  }

  clearSearch() {
    this.searchValue = '';
    this.getAllEquipments();
  }

  checkDuplicateCourse(equipmentName: string): boolean {
    const lowerCaseCode = equipmentName.trim().toLowerCase();
  
    return this.EquipmentArray.some(equipment => {
      return equipment.EquipmentName.trim().toLowerCase() === lowerCaseCode

    });
  }
  isAscendingSort: boolean = true;
  sortEquipmentByExpirationDate(): void {
    this.EquipmentArray.sort((a, b) => {
      const dateA = new Date(a.CalibrationSchedule);
      const dateB = new Date(b.CalibrationSchedule);
      if (this.isAscendingSort) {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
  }
  
  toggleSortOrder(): void {
    this.isAscendingSort = !this.isAscendingSort;
    this.sortEquipmentByExpirationDate();
  }

  refreshTable(): void{
    this.getAllEquipments();
  }
}