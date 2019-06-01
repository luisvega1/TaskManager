import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, empty, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebReqInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) { }

  refreshingAccessToken: boolean;

  accessTokenRefreshed: Subject<any> = new Subject();


  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // maneja el request
    request = this.addAuthHeader(request);

    // llama next() y maneja el response
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error);

        if (error.status === 401) {
          // 401 error entonces no somos autorizados
          // hace refresh el access token
          return this.refreshAccessToken()
            .pipe(
              switchMap(() => {
                request = this.addAuthHeader(request);
                return next.handle(request);
              }),
              catchError((err: any) => {
                console.log(err);
                this.authService.logout();
                return empty();
              })
            )
        }

        return throwError(error);
      })
    )
  }

  refreshAccessToken() {
    if (this.refreshingAccessToken) {
      return new Observable(observer => {
        this.accessTokenRefreshed.subscribe(() => {
          // este código se ejecutará cuando el access token se haya actualizado
          observer.next();
          observer.complete();
        })
      })
    } else {
      this.refreshingAccessToken = true;
      // queremos llamar a un método en el servicio de autenticación para enviar una solicitud para actualizar el token de acceso
      return this.authService.getNewAccessToken().pipe(
        tap(() => {
          console.log("Access Token Refreshed!");
          this.refreshingAccessToken = false;
          this.accessTokenRefreshed.next();
        })
      )
    }

  }


  addAuthHeader(request: HttpRequest<any>) {
    // obtener el access token
    const token = this.authService.getAccessToken();

    if (token) {
      // agregar el access token al header
      return request.clone({
        setHeaders: {
          'x-access-token': token
        }
      })
    }
    return request;
  }

}
