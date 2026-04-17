import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0d0d0d;color:#fff;">Loading...</div>'
})
export class LoaderComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    const width = window.screen.width;
    const height = window.screen.height;
    const features = `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes,top=0,left=0`;
    window.open(window.location.origin + '/menu', '_blank', features);
    this.router.navigate(['/menu']);
  }
}