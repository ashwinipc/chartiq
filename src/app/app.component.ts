import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import "chartiq/js/advanced";
import { CIQ } from "chartiq/js/components";
import quoteFeed from "./chartiq/binance";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements AfterViewInit {
  @ViewChild("chartContainer", { static: true }) chartContainer: ElementRef<
    HTMLInputElement
  > = {} as ElementRef;

  ngAfterViewInit() {
    const container = this.chartContainer.nativeElement;
    const stx: any = new CIQ.ChartEngine({ container });
    stx.attachQuoteFeed(quoteFeed, { refreshInterval: 1 });
    CIQ.UI.registerComponents();
    const uiContext = new CIQ.UI.Context(
      stx,
      document.querySelector("cq-context")
    );
    new CIQ.UI.Layout(uiContext);
    CIQ.UI.begin();
    stx.loadChart("=ADAUSDT/EOSUSDT", {
      periodicity: {
        period: 1,
        interval: 5,
        timeUnit: "minute"
      }
    });

    window["stxx"] = stx;
  }
}
