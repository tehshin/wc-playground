import { CommonModule } from '@angular/common';
import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { FileSystemTree, WebContainer } from '@webcontainer/api';

const files: FileSystemTree = {
  src: {
    directory: {
      'index.html': {
        file: {
          contents: `
          <html>
            <head>
              <title>Example</title>
            </head>
            <body>
              <app-root>Loading...</app-root>
            </body>
          </html>
          `,
        },
      },
      'app.component.ts': {
        file: {
          contents: `
          import { Component } from '@angular/core';
    
          @Component({
            selector: 'app-root',
            template: 'hello there',
            standalone: true
          })
          export class AppComponent {}
          `,
        },
      },
      'main.ts': {
        file: {
          contents: `
        import { bootstrapApplication } from '@angular/platform-browser';
        import { AppComponent } from './app.component';
        
        bootstrapApplication(AppComponent);
        `,
        },
      },
    },
  },
  'angular.json': {
    file: {
      contents: `
    {
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "newProjectRoot": "projects",
      "projects": {
        "example": {
          "projectType": "application",
          "root": "",
          "sourceRoot": "",
          "prefix": "app",
          "architect": {
            "build": {
              "builder": "@angular-devkit/build-angular:browser",
              "options": {
                "outputPath": "dist/example",
                "index": "src/index.html",
                "main": "src/main.ts",
                "polyfills": [
                  "zone.js"
                ]
                "tsConfig": "tsconfig.json"
              },
              "configurations": {
                "development": {
                  "buildOptimizer": false,
                  "optimization": false
                  "vendorChunk": true,
                  "extractLicenses": false,
                  "sourceMap": true,
                  "namedChunks": true
                }
              }
            },
            "serve": {
              "builder": "@angular-devkit/build-angular:dev-server",
              "configurations": {
                "development": {
                  "browserTarget": "example:build:development"
                }
              },
              "defaultConfiguration": "development"
            }
          }
        }
      }
    }
      `,
    },
  },
  'package.json': {
    file: {
      contents: `
    {
      "name": "example",
      "dependencies": {
        "@angular/animations": "16.1.0",
        "@angular/common": "16.1.0",
        "@angular/compiler": "16.1.0",
        "@angular/core": "16.1.0",
        "@angular/forms": "16.1.0",
        "@angular/platform-browser": "16.1.0",
        "@angular/platform-browser-dynamic": "16.1.0",
        "@angular/router": "16.1.0",
        "rxjs": "7.8.0",
        "tslib": "2.3.0",
        "zone.js": "0.13.0"
      },
      "devDependencies": {
        "@angular-devkit/build-angular": "16.1.3",
        "@angular/cli": "16.1.3",
        "@angular/compiler-cli": "16.1.0",
        "typescript": "5.1.3"
      }
    }
    `,
    },
  },
  'tsconfig.json': {
    file: {
      contents: `
      {
        "compileOnSave": false,
        "compilerOptions": {
          "strict": true,
          "outDir": "./dist/out-tsc",
          "sourceMap": true,
          "declaration": false,
          "downlevelIteration": true,
          "experimentalDecorators": true,
          "module": "esnext",
          "moduleResolution": "node",
          "importHelpers": true,
          "target": "es2015",
          "typeRoots": ["node_modules/@types"],
          "lib": ["es2018", "dom"]
        },
        "angularCompilerOptions": {
          "strictTemplates": true,
          "strictInjectionParameters": true
        }
      }
      `,
    },
  },
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'playground';

  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  async startDevServer() {
    const webcontainer = await WebContainer.boot();

    await webcontainer.mount(files);

    const installProcess = await webcontainer.spawn('npm', ['install']);
    installProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          console.log(data);
        },
      })
    );
    const exitCode = await installProcess.exit;

    if (exitCode !== 0) {
      throw new Error('npm install failed');
    }

    const serveProcess = await webcontainer.spawn('ng', ['serve']);
    serveProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          console.log(data);
        },
      })
    );

    webcontainer.on('server-ready', (ports, url) => {
      console.log(`Server ready at ${url}`, this.iframe);
      if (!this.iframe) return;
      this.iframe.nativeElement.src = url;
    });
  }
}
