export type EmailTemplateType = 'Standard CUFC' | 'LynxCup';

export const DEFAULT_TEMPLATE: EmailTemplateType = 'Standard CUFC';

export const AVAILABLE_TEMPLATES: EmailTemplateType[] = ['Standard CUFC', 'LynxCup'];

export function applyTemplate(message: string, templateName: EmailTemplateType): string {
  if (templateName === 'LynxCup') {
    return wrapLynxCup(message);
  }
  return wrapStandard(message);
}

function wrapStandard(message: string): string {
  return `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
      color: #0F1B26;
    ">
      <div style="
        padding: 30px 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
        border-bottom: 2px solid #511F33;
      ">
        <img src="https://www.columbusunitedfencing.com/assets/logo.png"
             alt="Columbus United Fencing Club"
             style="
               max-width: 100%;
               width: auto;
               height: auto;
               display: block;
               margin: 0 auto;
               border-radius: 8px;
             "/>
      </div>
      <div style="
        padding: 30px 20px;
        border-left: 1px solid #511F33;
        border-right: 1px solid #511F33;
        color: #0F1B26;
      ">
        ${message.split('\n\n').map(paragraph => `
          <p style="
            margin: 0 0 20px 0;
            font-size: 16px;
            line-height: 1.6;
            color: #0F1B26;
          ">${paragraph.replace(/\n/g, '<br/>')}</p>
        `).join('')}
      </div>
      <div style="
        padding: 20px;
        text-align: center;
        border-radius: 0 0 8px 8px;
        border-top: 2px solid #511F33;
      ">
        <p style="
          margin: 0 0 10px 0; 
          font-size: 14px; 
          color: #0F1B26;
        ">
          Columbus United Fencing Club<br/>
          6475 E Main St. #111<br/>
          Reynoldsburg, OH 43068
        </p>
        <p style="margin: 0; font-size: 14px;">
          <a href="https://www.columbusunitedfencing.com/unsubscribe" 
             style="
               text-decoration: underline;
               color: blue;
             ">
            Click here to unsubscribe from promotional emails
          </a>
        </p>
      </div>
    </div>
  `;
}

function wrapLynxCup(message: string): string {
  return `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
      color: #0F1B26;
    ">
      <div style="
        padding: 30px 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
        border-bottom: 2px solid #511F33;
      ">
        <img src="https://www.columbusunitedfencing.com/assets/lynxcupnoyear.png"
             alt="Lynx Cup 2026"
             style="
               max-width: 100%;
               width: auto;
               height: auto;
               display: block;
               margin: 0 auto;
               border-radius: 8px;
             "/>
      </div>
      <div style="
        padding: 30px 20px;
        border-left: 1px solid #511F33;
        border-right: 1px solid #511F33;
        color: #0F1B26;
      ">
        ${message.split('\n\n').map(paragraph => `
          <p style="
            margin: 0 0 20px 0;
            font-size: 16px;
            line-height: 1.6;
            color: #0F1B26;
          ">${paragraph.replace(/\n/g, '<br/>')}</p>
        `).join('')}
      </div>
      <div style="
        padding: 20px;
        text-align: center;
        border-radius: 0 0 8px 8px;
        border-top: 2px solid #511F33;
        background-color: #511F33;
      ">
        <div style="margin-bottom: 8px;">
          <span style="font-size: 24px; font-weight: bold; color: #fff; display: block;">Lynx Cup 2026</span>
          <span style="font-size: 12px; font-style: italic; color: #fff; display: block;">hosted by</span>
        </div>
        <p style="
          margin: 0 0 10px 0; 
          font-size: 14px; 
          color: #0F1B26;
        ">
          Columbus United Fencing Club<br/>
          6475 E Main St. #111<br/>
          Reynoldsburg, OH 43068
        </p>
        <p style="margin: 0; font-size: 14px;">
          <a href="https://www.columbusunitedfencing.com/unsubscribe" 
             style="
               text-decoration: underline;
               color: blue;
             ">
            Click here to unsubscribe from promotional emails
          </a>
        </p>
      </div>
    </div>
  `;
}
