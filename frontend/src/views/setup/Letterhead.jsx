import React from 'react';
import './Letterhead.css';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function Letterhead() {
  return (
    <div>
      <h2 className="setup-page-title">Letterhead</h2>
      
      <div className="letterhead-grid">
        {/* Left: Form */}
        <div>
          <div className="setup-form-group">
            <input type="file" className="setup-input" />
            <p style={{fontSize:'0.8rem', color:'#6b7280', marginTop:'0.5rem'}}>(Supported file formats: jpeg, jpg, png)</p>
            <a href="#pdf" style={{color:'#2563eb', fontSize:'0.9rem', textDecoration:'none'}}>Letterhead PDF</a>
          </div>

          <p style={{fontSize:'0.85rem', color:'#374151', marginBottom:'1rem'}}>Don't have a letterhead? Instantly create one with the <a href="#generator" style={{color:'#2563eb'}}>Labsmart Letterhead Generator App!</a></p>

          <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem'}}>
            <div className="setup-form-group" style={{flex:1}}>
              <label className="setup-label">Header height</label>
              <div style={{display:'flex', alignItems:'center'}}>
                <input type="text" className="setup-input" defaultValue="4.60" />
                <span style={{marginLeft:'-2rem', color:'#6b7280', fontSize:'0.85rem'}}>cm</span>
              </div>
            </div>
            <div className="setup-form-group" style={{flex:1}}>
              <label className="setup-label">Footer height</label>
              <div style={{display:'flex', alignItems:'center'}}>
                <input type="text" className="setup-input" defaultValue="3.40" />
                <span style={{marginLeft:'-2rem', color:'#6b7280', fontSize:'0.85rem'}}>cm</span>
              </div>
            </div>
          </div>

          <div style={{marginBottom:'1rem', fontSize:'0.9rem', color:'#374151', cursor:'pointer'}}>More setting ⌄</div>
          <button className="setup-btn-blue">Update Margins</button>
        </div>

        {/* Center: Mockup */}
        <div style={{display:'flex', justifyContent:'center'}}>
          <div className="letterhead-mockup-wrapper">
            <div className="letterhead-success-banner">✓ Letterhead image is in correct A4 aspect ratio.</div>
            <div className="letterhead-paper">
              <div className="letterhead-header">
                <div style={{fontSize:'1rem', fontWeight:'600'}}>LabSetu Software</div>
                <div style={{fontSize:'0.9rem'}}>Sample Letterhead</div>
              </div>
              
              <div className="letterhead-margin-line top-margin">
                <span className="margin-label">Header: 4.60 cm</span>
              </div>
              
              <div className="letterhead-content"></div>
              
              <div className="letterhead-margin-line bottom-margin">
                <span className="margin-label">Footer: 3.40 cm</span>
              </div>

              <div className="letterhead-footer">
                <div style={{fontSize:'0.6rem', textAlign:'center'}}>NOT VALID FOR MEDICO LEGAL PURPOSE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div>
          <h4 style={{color:'#2563eb', fontSize:'0.95rem', marginBottom:'1rem'}}>Important information</h4>
          <div className="letterhead-info-box">
            <InformationCircleIcon style={{width:'20px', flexShrink:0, color:'#6b7280'}} />
            <span>Please note down the settings before making any changes so that you can always restore the original settings.</span>
          </div>
          <div className="letterhead-info-box">
            <InformationCircleIcon style={{width:'20px', flexShrink:0, color:'#6b7280'}} />
            <span>You can get JPG from your printer (or graphic designer) & upload here. Please ask for file size 100kb.</span>
          </div>
          <div className="letterhead-info-box">
            <InformationCircleIcon style={{width:'20px', flexShrink:0, color:'#6b7280'}} />
            <span>Use a centimeter scale to measure header and footer height.</span>
          </div>
          <div className="letterhead-info-box">
            <InformationCircleIcon style={{width:'20px', flexShrink:0, color:'#6b7280'}} />
            <span>Standard A4 size is 21 cm by 29.7 cm. Image will be resized to 1000px by 1414px, max size allowed is 400kb.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
