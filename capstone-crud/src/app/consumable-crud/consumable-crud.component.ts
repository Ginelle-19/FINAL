import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Data, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppComponent } from '../app.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EquipmentCrudComponent } from '../equipment-crud/equipment-crud.component';
// ===================
import { CourseCrudComponent } from '../course-crud/course-crud.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { DataService } from '../data.service';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-consumable-crud',
  standalone: true,
  imports: [
    HttpClientModule,
    RouterOutlet,
    CommonModule,
    AppComponent,
    FormsModule,
    RouterModule,
    EquipmentCrudComponent,
    CourseCrudComponent,
    NgxPaginationModule,
    MatIconModule,
  ],
  templateUrl: './consumable-crud.component.html',
  styleUrl: './consumable-crud.component.css',
  providers: [DatePipe],
})
export class ConsumableCrudComponent {
  ConsumableArray: any[] = [];
  CourseArray: any[] = [];
  isResultLoaded = false;
  isUpdateFormActive = false;

  searchValue: string = '';
  searchResult: any[] = [];

  currentID = '';
  CourseID!: number;
  ConsumableName: string = '';
  Quantity?: number;
  ConsumableStat: string = '';
  ExpirationDate: Date | null = null;

  SelectedCourseID: number | null = null;

  minDate: string;

  p: number = 1;
  itemsPerPage: number = 7;

  private emailSent = false;

  isPDF: boolean = false; 

  @ViewChild('content') content!: ElementRef;
public SavePDF(consumables: any[]): void {
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
  const title = 'Consumable Report';
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0];
  doc.text(title, 14, 10);
  doc.text(`Generated on: ${formattedDate}`, 14, 18);

  // Convert HTML content to array of data
  const data = this.extractTableData(content, consumables);

  // Generate PDF using jspdf-autotable
  autoTable(doc, {
    head: [['ID', 'Consumable Name', 'Quantity','Status', 'Expiration Date']],
    body: data,
    startY: 30
  });

  // Save the PDF
  doc.save('Consumable.pdf');
}

  
  // Helper method to extract table data from HTML content
  private extractTableData(content: HTMLElement, consumables: any[]): any[] {
    const data: any[] = [];
    const rows = content.querySelectorAll('tr');
  
    // Iterate over rows and extract cell data
    rows.forEach(row => {
      const rowData: any[] = [];
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        rowData.push(cell.textContent ?? ''); 
      });

      if (rowData.length > 0) {
        data.push(rowData);
      }
    });
  

    consumables.forEach((consumable, index) => {
      data[index] = [consumable.ConsumableID, consumable.ConsumableName, consumable.Quantity, this.getStatusString(consumable.Quantity), consumable.ExpirationDate];
    });
  
    return data;
  }

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private datePipe: DatePipe,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.getAllConsumables();

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  getAllConsumables() {
    this.http
      .get('https://ccjeflabsolutions.online:3000/api/consumables')
      .subscribe((resultData: any) => {
        this.isResultLoaded = true;
        this.ConsumableArray = resultData.data;
      });
  }
  
  validateInputs(): boolean {
    return (
      this.ConsumableName.trim() !== '' &&
      this.Quantity !== null &&
      this.Quantity !== undefined &&
      this.Quantity > 0 &&
      this.CourseID !== null
    );
  }

  register() {
    if (this.checkDuplicateCourse(this.ConsumableName)) {
      alert('Consumable with the same name already exists.');
      return; 
    }
    if (this.validateInputs()) {
      let bodyData = {
        ConsumableName: this.ConsumableName,
        Quantity: this.Quantity,
        ExpirationDate: this.ExpirationDate || null,
        CourseID: this.CourseID,
      };
  
    this.http
      .post('https://ccjeflabsolutions.online:3000/api/consumables/add', bodyData)
      .subscribe((resultData: any) => {
        alert('Consumable Added Successfully!');
        this.getAllConsumables();
      });
    this.clearInputs();
    }
  }

  setUpdate(data: any) {
    this.ConsumableName = data.ConsumableName;
    this.Quantity = data.Quantity;
    this.ExpirationDate = data.ExpirationDate;
    this.CourseID = data.CourseID;
    this.currentID = data.ConsumableID;
  }

  UpdateRecords() {
    let bodyData = {
      ConsumableName: this.ConsumableName,
      Quantity: this.Quantity,
      ExpirationDate: this.datePipe.transform(
        this.ExpirationDate,
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
        'https://ccjeflabsolutions.online:3000/api/consumables/update' + '/' + this.currentID,
        bodyData
      )
      .subscribe((resultData: any) => {
        alert('Consumable Updated Successfully!');
        this.getAllConsumables();
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
    this.CourseID = 0;
    this.ConsumableName = '';
    this.Quantity = 0;
    this.ExpirationDate = null;
  }

  setDelete(data: any) {
    const confirmation = window.confirm(
      'Are you sure you want to delete this record?'
    );

    if (confirmation) {
      this.http
        .delete(
          'https://ccjeflabsolutions.online:3000/api/consumables/delete' +
            '/' +
            data.ConsumableID
        )
        .subscribe(
          (resultData: any) => {
            alert('Record Deleted');
            this.getAllConsumables();
          },
          (error) => {
            console.error('Error deleting record: ', error);
          }
        );
    }
  }

  getStatusClass(Quantity: number): string {
    let status = '';

    if (Quantity <= 0) {
      status = 'Not-Available';
    } else if (Quantity < 5) {
      status = 'Low-on-Stock';
    } else {
      status = 'Available';
    }


    if (
      (status === 'Low-on-Stock' || status === 'Not-Available') &&
      !this.emailSent
    ) {
      this.sendEmailOnLowStockOrNotAvailable();
      this.emailSent = true;
    }

    return status;
  }

  getStatusString(Quantity: number): string {
    if (Quantity <= 0) {
      return 'Not Available';
    } else if (Quantity < 5) {
      return 'Low on Stock';
    } else {
      return 'Available';
    }
  }

  sendEmailOnLowStockOrNotAvailable() {
    const lowStockItems = this.ConsumableArray.filter(
      (item) => item.Quantity < 5
    );
    const notAvailableItems = this.ConsumableArray.filter(
      (item) => item.Quantity <= 0
    );


    if (
      (lowStockItems.length > 0 || notAvailableItems.length > 0) &&
      !this.emailSent
    ) {
      let emailContent = `Consumables Status Alert:\n\n`;

      if (lowStockItems.length > 0) {
        emailContent += `Low on Stock:\n${this.formatItems(lowStockItems)}\n\n`;
      }

      if (notAvailableItems.length > 0) {
        emailContent += `Not Available:\n${this.formatItems(
          notAvailableItems
        )}\n\n`;
      }

      this.http
        .post('https://ccjeflabsolutions.online:3000/send-email', { content: emailContent })
        .subscribe(
          (response) => {
            this.emailSent = true; 
          },
          (error) => {
            // console.error('Error sending email:', error);
          }
        );
    }
  }

  formatItems(items: any[]): string {
    return items
      .map((item) => `ID: ${item.ConsumableID}, Name: ${item.ConsumableName}`)
      .join('\n');
  }

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

  clearFilter(): void {
    this.SelectedCourseID = null;
    this.changeDetectorRef.detectChanges();
    this.filterConsumables();
  }

  filterConsumables(): void {
    if (this.SelectedCourseID !== null) {
      this.dataService
        .getConsumablesByCourseId(this.SelectedCourseID)
        .subscribe(
          (response: any) => {
            this.ConsumableArray = response.data;
          },
          (error) => {
            console.error('Error connecting to API: ', error);
          }
        );
    } else {
      this.http.get('https://ccjeflabsolutions.online:3000/api/consumables').subscribe(
        (response: any) => {
          this.ConsumableArray = response.data;
        },
        (error) => {
          console.error('Error connecting to API: ', error);
        }
      );
    }
  }

  assignCourse(): void {
    if (this.SelectedCourseID !== null) {
      this.dataService
        .getConsumablesByCourseId(this.SelectedCourseID)
        .subscribe(
          (response: any) => {
            this.ConsumableArray = response.data;
          },
          (error) => {
            console.error('Error connecting to API: ', error);
          }
        );
    }
  }
  selectedStatus: string = 'all';
  searchConsumables() {
    if (this.searchValue.trim() !== '') {
      const searchTerm = this.searchValue.trim().toLowerCase();
      this.http.get('https://ccjeflabsolutions.online:3000/api/consumables').subscribe(
        (response: any) => {
          this.ConsumableArray = response.data.filter((consumable: any) =>
            consumable.ConsumableName.toLowerCase().includes(searchTerm)
          );
        },
        (error) => {
          console.error('Error searching equipment:', error);
        }
      );
    } else {

      this.getAllConsumables();
    }
  }

  clearSearch() {
    this.searchValue = ''; 
    this.getAllConsumables(); 
  }

  applyFilter() {
    this.p = 1; // Reset pagination to first page
  
    if (this.selectedStatus === 'low') {
      this.ConsumableArray = this.ConsumableArray.filter(consumable => consumable.Quantity < 5);
    } else if (this.selectedStatus === 'not_available') {
      this.ConsumableArray = this.ConsumableArray.filter(consumable => consumable.Quantity <= 0);
    } else if (this.selectedStatus === 'available') {
      this.ConsumableArray = this.ConsumableArray.filter(consumable => consumable.Quantity > 5);
    } else {
      // Reset the filter and fetch all consumables
      this.getAllConsumables();
    }
  }

  checkDuplicateCourse(consumableName: string): boolean {
    const lowerCaseCode = consumableName.trim().toLowerCase();
  
    return this.ConsumableArray.some(consumable => {
      return consumable.ConsumableName.trim().toLowerCase() === lowerCaseCode

    });
  }

  
isAscendingSort: boolean = true;
sortConsumablesByExpirationDate(): void {
  this.ConsumableArray.sort((a, b) => {
    const dateA = new Date(a.ExpirationDate);
    const dateB = new Date(b.ExpirationDate);
    if (this.isAscendingSort) {
      return dateA.getTime() - dateB.getTime();
    } else {
      return dateB.getTime() - dateA.getTime();
    }
  });
}

toggleSortOrder(): void {
  this.isAscendingSort = !this.isAscendingSort;
  this.sortConsumablesByExpirationDate();
}

refreshTable(): void{
  this.getAllConsumables();
}
}