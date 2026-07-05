;;----------------------------------------------------------------------;;
;; Program: Text2Tabel                                                 ;;
;; Filename: Text2Tabel.lsp                                            ;;
;; Command: Text2Tabel                                                 ;;
;; Version: 1.0                                                        ;;
;; Author: Ivaneiko Volodymyr                                          ;;
;; Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.         ;;
;;                                                                      ;;
;; Proprietary license: free use is permitted in personal and          ;;
;; commercial projects. Resale, public republication without written  ;;
;; permission, and distribution of modified versions under the         ;;
;; original name are prohibited.                                       ;;
;;                                                                      ;;
;; This software is provided "as is", without warranty of any kind.    ;;
;; The user is solely responsible for the results of its use.           ;;
;;----------------------------------------------------------------------;;
;; Text2Tabel.lsp
;; Creates AutoCAD tables from selected text or line-drawn tables.
;; References:
;; - Lee Mac PolyInfo V1.3: https://www.lee-mac.com/lisp/html/PolyInfoV1-3.html
;; - Lee Mac Text2MText V2.0: https://www.lee-mac.com/lisp/html/Text2MTextV2-0.html

(vl-catch-all-apply 'vl-load-com nil)

(defun t2t:acdoc nil
  (vla-get-activedocument (vlax-get-acad-object))
)

(defun t2t:space (doc)
  (vlax-get-property doc (if (= 1 (getvar 'cvport)) 'paperspace 'modelspace))
)

(defun t2t:start-undo (doc)
  (vla-startundomark doc)
)

(defun t2t:end-undo (doc)
  (while (= 8 (logand 8 (getvar 'undoctl)))
    (vla-endundomark doc)
  )
)

(defun t2t:object-name (obj)
  (strcase (vla-get-objectname obj))
)

(defun t2t:text-object-p (obj)
  (wcmatch (t2t:object-name obj) "*TEXT")
)

(defun t2t:table-object-p (obj)
  (wcmatch (t2t:object-name obj) "*ACDBTABLE*")
)

(defun t2t:text-string (obj)
  (cond
    ((vlax-property-available-p obj 'textstring) (vla-get-textstring obj))
    (t "")
  )
)

(defun t2t:safearray->list (value / unwrapped)
  (setq unwrapped (vl-catch-all-apply 'vlax-variant-value (list value)))
  (if (vl-catch-all-error-p unwrapped)
    (vlax-safearray->list value)
    (vlax-safearray->list unwrapped))
)

(defun t2t:midpoint (a b)
  (mapcar '(lambda (x y) (/ (+ x y) 2.0)) a b)
)

(defun t2t:abs (value)
  (if (< value 0.0) (- value) value)
)

(defun t2t:text-bounds (obj / minp maxp result)
  (if (not (vl-catch-all-error-p
             (setq result
               (vl-catch-all-apply 'vla-getboundingbox (list obj 'minp 'maxp)))))
    (list (t2t:safearray->list minp) (t2t:safearray->list maxp))
  )
)

(defun t2t:text-point (obj / minp maxp result)
  (cond
    ((setq result (t2t:text-bounds obj))
      (t2t:midpoint (car result) (cadr result)))
    ((vlax-property-available-p obj 'insertionpoint)
      (t2t:safearray->list (vla-get-insertionpoint obj)))
    (t '(0.0 0.0 0.0))
  )
)

(defun t2t:ss->objects (ss / idx out)
  (setq idx 0
        out nil)
  (if ss
    (while (< idx (sslength ss))
      (setq out (cons (vlax-ename->vla-object (ssname ss idx)) out)
            idx (1+ idx))
    )
  )
  (reverse out)
)

(defun t2t:text-height (obj / bounds value)
  (cond
    ((setq bounds (t2t:text-bounds obj))
      (max 1e-6 (t2t:abs (- (cadar bounds) (cadadr bounds)))))
    ((and (vlax-property-available-p obj 'height)
          (numberp (setq value (vla-get-height obj)))
          (> value 1e-6))
      value)
    (1.0)
  )
)

(defun t2t:text-record (obj / pt)
  (setq pt (t2t:text-point obj))
  (list (car pt) (cadr pt) (t2t:text-string obj) obj (t2t:text-height obj))
)

(defun t2t:sort-records-reading (records)
  (vl-sort records
    '(lambda (a b)
       (if (equal (cadr a) (cadr b) 1e-8)
         (< (car a) (car b))
         (> (cadr a) (cadr b))
       )
     )
  )
)

(defun t2t:row-tolerance (records / heights total count ys)
  (setq heights nil
        total 0.0
        count 0
        ys (mapcar 'cadr records))
  (foreach rec records
    (if (> (nth 4 rec) 1e-6)
      (setq heights (cons (nth 4 rec) heights)
            total (+ total (nth 4 rec))
            count (1+ count)))
  )
  (cond
    ((> count 0)
      (max 1e-4 (* 0.35 (/ total count))))
    (ys
      (max 1e-4 (/ (- (apply 'max ys) (apply 'min ys)) 200.0)))
    (t 1e-4)
  )
)

(defun t2t:row-match-tolerance (base-tol row-height rec-height)
  (max base-tol (* 0.5 (/ (+ row-height rec-height) 2.0)))
)

(defun t2t:group-records-rows (records / tol rows row rowy rowheight rowcount rec recy rech)
  (setq records (t2t:sort-records-reading records)
        tol (t2t:row-tolerance records)
        rows nil
        row nil
        rowy nil
        rowheight nil
        rowcount 0)
  (foreach rec records
    (setq recy (cadr rec)
          rech (nth 4 rec))
    (cond
      ((null row)
        (setq row (list rec)
              rowy recy
              rowheight rech
              rowcount 1))
      ((<= (t2t:abs (- recy rowy)) (t2t:row-match-tolerance tol rowheight rech))
        (setq row (append row (list rec))
              rowcount (1+ rowcount)
              rowy (/ (+ (* rowy (- rowcount 1)) recy) rowcount)
              rowheight (/ (+ (* rowheight (- rowcount 1)) rech) rowcount)))
      (t
        (setq rows (append rows (list (vl-sort row '(lambda (a b) (< (car a) (car b)))))))
        (setq row (list rec)
              rowy recy
              rowheight rech
              rowcount 1))
    )
  )
  (if row
    (setq rows (append rows (list (vl-sort row '(lambda (a b) (< (car a) (car b)))))))
  )
  rows
)

(defun t2t:rows-from-records (record-rows)
  (mapcar '(lambda (row) (mapcar 'caddr row)) record-rows)
)

(defun t2t:repeat-string (value count / out)
  (setq out nil)
  (repeat count (setq out (cons value out)))
  out
)

(defun t2t:take (lst count / out)
  (while (and lst (< (length out) count))
    (setq out (cons (car lst) out)
          lst (cdr lst))
  )
  (reverse out)
)

(defun t2t:normalize-row (row cols)
  (cond
    ((<= cols 0) nil)
    ((> (length row) cols) (t2t:take row cols))
    ((< (length row) cols) (append row (t2t:repeat-string "" (- cols (length row)))))
    (t row)
  )
)

(defun t2t:normalize-rows (rows cols)
  (mapcar '(lambda (row) (t2t:normalize-row row cols)) rows)
)

(defun t2t:any-row-longer-p (rows cols)
  (if rows
    (or (> (length (car rows)) cols)
        (t2t:any-row-longer-p (cdr rows) cols))
  )
)

(defun t2t:max-row-length (rows / maxlen)
  (setq maxlen 0)
  (foreach row rows
    (if (> (length row) maxlen) (setq maxlen (length row)))
  )
  maxlen
)

(defun t2t:table-available-p (space)
  (vlax-method-applicable-p space 'addtable)
)

(defun t2t:safe-put-property (obj prop value)
  (if (vlax-property-available-p obj prop)
    (vl-catch-all-apply
      (read (strcat "vla-put-" (vl-symbol-name prop)))
      (list obj value))
  )
)

(defun t2t:prepare-table-cells (table rowcount colcount)
  (t2t:safe-put-property table 'titlesuppressed :vlax-true)
  (t2t:safe-put-property table 'headersuppressed :vlax-true)
  (if (and (> rowcount 0)
           (> colcount 0)
           (vlax-method-applicable-p table 'unmergecells))
    (vl-catch-all-apply
      'vla-unmergecells
      (list table 0 (1- rowcount) 0 (1- colcount)))
  )
  table
)

(defun t2t:add-table (rows ins / doc space cols table rowheight colwidth r c row value)
  (setq doc (t2t:acdoc)
        space (t2t:space doc)
        cols (t2t:max-row-length rows)
        rowheight 2.5
        colwidth 20.0)
  (cond
    ((or (null rows) (= 0 cols))
      (princ "\nNo table data to create.")
      nil)
    ((not (t2t:table-available-p space))
      (princ "\nThis AutoCAD version does not expose AddTable.")
      nil)
    (t
      (setq rows (t2t:normalize-rows rows cols)
            table (vla-addtable space (vlax-3d-point (trans ins 1 0))
                                (length rows) cols rowheight colwidth)
            r 0)
      (t2t:prepare-table-cells table (length rows) cols)
      (foreach row rows
        (setq c 0)
        (foreach value row
          (vla-settext table r c (if value (vl-princ-to-string value) ""))
          (setq c (1+ c))
        )
        (setq r (1+ r))
      )
      table)
  )
)

(defun t2t:near= (a b tol)
  (<= (abs (- a b)) tol)
)

(defun t2t:segment-horizontal-p (seg tol)
  (t2t:near= (cadr (car seg)) (cadr (cadr seg)) tol)
)

(defun t2t:segment-vertical-p (seg tol)
  (t2t:near= (car (car seg)) (car (cadr seg)) tol)
)

(defun t2t:line-segments (ent / data p1 p2)
  (setq data (entget ent)
        p1 (cdr (assoc 10 data))
        p2 (cdr (assoc 11 data)))
  (if (and p1 p2)
    (list (list p1 p2))
  )
)

(defun t2t:point3d (pt)
  (list (car pt) (cadr pt) (if (caddr pt) (caddr pt) 0.0))
)

(defun t2t:dxf-value (code data default / item)
  (if (setq item (assoc code data))
    (cdr item)
    default
  )
)

(defun t2t:nonzero-bulge-p (data / curved)
  (setq curved nil)
  (foreach item data
    (if (and (= 42 (car item))
             (not (equal 0.0 (cdr item) 1e-12)))
      (setq curved t)))
  curved
)

(defun t2t:lwpolyline-point-wcs (ent pt elev)
  (trans (list (car pt) (cadr pt) elev) ent 0)
)

(defun t2t:legacy-polyline-2d-p (header / flags)
  (= 0 (logand 88 (t2t:dxf-value 70 header 0)))
)

(defun t2t:legacy-polyline-elevation (header / dummy)
  (cond
    ((assoc 30 header) (cdr (assoc 30 header)))
    ((setq dummy (cdr (assoc 10 header))) (if (caddr dummy) (caddr dummy) 0.0))
    (t 0.0)
  )
)

(defun t2t:points->segments (points closed / out first prev)
  (setq out nil
        first nil
        prev nil)
  (foreach pt points
    (setq pt (t2t:point3d pt))
    (if prev
      (setq out (cons (list prev pt) out))
      (setq first pt))
    (setq prev pt)
  )
  (if (and closed prev first (not (equal prev first 1e-12)))
    (setq out (cons (list prev first) out)))
  (reverse out)
)

(defun t2t:lwpolyline-segments (ent / data points closed elev)
  (setq data (entget ent)
        points nil
        elev (t2t:dxf-value 38 data 0.0)
        closed (= 1 (logand 1 (cdr (assoc 70 data)))))
  (if (t2t:nonzero-bulge-p data)
    (progn
      (princ "\nCurved LWPOLYLINE segments are not supported.")
      nil)
    (progn
      (foreach item data
        (if (= 10 (car item))
          (setq points
            (append points (list (t2t:lwpolyline-point-wcs ent (cdr item) elev))))))
      (t2t:points->segments points closed)))
)

(defun t2t:legacy-polyline-segments (ent / header next data points closed is-2d elev vertex flags curved)
  (setq header (entget ent)
        next (entnext ent)
        points nil
        is-2d (t2t:legacy-polyline-2d-p header)
        elev (t2t:legacy-polyline-elevation header)
        closed (= 1 (logand 1 (cdr (assoc 70 header))))
        curved nil)
  (while next
    (setq data (entget next))
    (cond
      ((= "VERTEX" (cdr (assoc 0 data)))
        (setq vertex (cdr (assoc 10 data))
              flags (t2t:dxf-value 70 data 0))
        (cond
          ((and (/= 0 (logand 128 flags))
                (= 0 (logand 64 flags))))
          (is-2d
            ;; Autodesk DXF stores 2D POLYLINE vertex coordinates in OCS; 3D variants are already WCS.
            (setq points (append points (list (trans (list (car vertex) (cadr vertex) elev) ent 0)))))
          (t
            (setq points (append points (list (t2t:point3d vertex))))))
        (if (t2t:nonzero-bulge-p data)
          (setq curved t))
      )
      ((= "SEQEND" (cdr (assoc 0 data)))
        (setq next nil))
    )
    (if next
      (setq next (entnext next)))
  )
  (if curved
    (progn
      (princ "\nCurved POLYLINE segments are not supported.")
      nil)
    (t2t:points->segments points closed))
)

(defun t2t:curve-segments (ent / typ)
  (setq typ (cdr (assoc 0 (entget ent))))
  (cond
    ((= typ "LWPOLYLINE") (t2t:lwpolyline-segments ent))
    ((= typ "POLYLINE") (t2t:legacy-polyline-segments ent))
    (t nil)
  )
)

(defun t2t:entity-segments (ent / data typ)
  (setq data (entget ent)
        typ (cdr (assoc 0 data)))
  (cond
    ((= typ "LINE") (t2t:line-segments ent))
    ((wcmatch typ "LWPOLYLINE,POLYLINE") (t2t:curve-segments ent))
    (t nil)
  )
)

(defun t2t:cluster-values (values tol / sorted clusters current seed)
  (setq sorted (vl-sort values '<)
        clusters nil
        current nil
        seed nil)
  (foreach value sorted
    (if (null current)
      (setq current (list value)
            seed value)
      (if (t2t:near= value seed tol)
        (setq current (append current (list value)))
        (progn
          (setq clusters (append clusters (list (/ (apply '+ current) (float (length current))))))
          (setq current (list value)
                seed value)
        )
      )
    )
  )
  (if current
    (setq clusters (append clusters (list (/ (apply '+ current) (float (length current)))))))
  clusters
)

(defun t2t:between-p (value a b tol)
  (and (<= (- (min a b) tol) value)
       (<= value (+ (max a b) tol)))
)

(defun t2t:hv-intersection (h v tol / y x)
  (setq y (cadar h)
        x (caar v))
  (if (and (t2t:between-p x (caar h) (caadr h) tol)
           (t2t:between-p y (cadar v) (cadadr v) tol))
    (list x y 0.0)
  )
)

(defun t2t:segment-span (seg axis / a b)
  (if (eq axis 'x)
    (setq a (car (car seg))
          b (car (cadr seg)))
    (setq a (cadr (car seg))
          b (cadr (cadr seg))))
  (if (<= a b)
    (list a b)
    (list b a))
)

(defun t2t:segment-axis-value (seg axis)
  (if (eq axis 'x)
    (car (car seg))
    (cadr (car seg))
  )
)

(defun t2t:segment-endpoint-values (segments axis / values)
  (setq values nil)
  (foreach seg segments
    (if (eq axis 'x)
      (setq values (append values (list (car (car seg)) (car (cadr seg)))))
      (setq values (append values (list (cadr (car seg)) (cadr (cadr seg)))))))
  values
)

(defun t2t:value-span (values)
  (if values
    (- (apply 'max values) (apply 'min values))
    0.0
  )
)

(defun t2t:geometry-tolerance (segments / xs ys span)
  (setq xs (t2t:segment-endpoint-values segments 'x)
        ys (t2t:segment-endpoint-values segments 'y)
        span (max (t2t:value-span xs) (t2t:value-span ys)))
  (max 1e-4 (min 0.05 (* span 1e-6)))
)

(defun t2t:grid-coordinate-values (segments axis tol / values seg)
  (setq values nil)
  (foreach seg segments
    (setq values (cons (t2t:segment-axis-value seg axis) values))
  )
  (t2t:cluster-values values tol)
)

(defun t2t:ranges-cover-interval-p (ranges start end tol / sorted coverage range)
  (setq sorted (vl-sort ranges '(lambda (a b) (< (car a) (car b))))
        coverage start)
  (while (and sorted (<= coverage (+ end tol)))
    (setq range (car sorted)
          sorted (cdr sorted))
    (if (<= (car range) (+ coverage tol))
      (if (> (cadr range) coverage)
        (setq coverage (cadr range)))))
  (>= coverage (- end tol))
)

(defun t2t:boundary-covered-p (segments orientation fixed start end tol / ranges)
  (setq ranges nil)
  (foreach seg segments
    (cond
      ((and (eq orientation 'horizontal)
            (t2t:segment-horizontal-p seg tol)
            (t2t:near= (cadr (car seg)) fixed tol))
        (setq ranges (cons (t2t:segment-span seg 'x) ranges)))
      ((and (eq orientation 'vertical)
            (t2t:segment-vertical-p seg tol)
            (t2t:near= (car (car seg)) fixed tol))
        (setq ranges (cons (t2t:segment-span seg 'y) ranges)))
    )
  )
  (and ranges (t2t:ranges-cover-interval-p ranges start end tol))
)

(defun t2t:cell-rectangle-complete-p (segments x1 x2 ytop ybottom tol)
  (and (t2t:boundary-covered-p segments 'horizontal ytop x1 x2 tol)
       (t2t:boundary-covered-p segments 'horizontal ybottom x1 x2 tol)
       (t2t:boundary-covered-p segments 'vertical x1 ybottom ytop tol)
       (t2t:boundary-covered-p segments 'vertical x2 ybottom ytop tol))
)

(defun t2t:grid-cells-complete-p (segments xs ys tol / xrest yrest x1 x2 ytop ybottom complete)
  (setq yrest ys)
  (setq complete t)
  (while (and complete yrest (cdr yrest))
    (setq ytop (car yrest)
          ybottom (cadr yrest)
          xrest xs)
    (while (and complete xrest (cdr xrest))
      (setq x1 (car xrest)
            x2 (cadr xrest))
      (if (not (t2t:cell-rectangle-complete-p segments x1 x2 ytop ybottom tol))
        (setq complete nil)
        (setq xrest (cdr xrest)))
    )
    (if complete
      (setq yrest (cdr yrest)))
  )
  complete
)

(defun t2t:grid-from-segments (segments tol / hsegs vsegs pts xvals yvals hit)
  (setq hsegs nil
        vsegs nil
        pts nil
        xvals nil
        yvals nil)
  (foreach seg segments
    (cond
      ((t2t:segment-horizontal-p seg tol)
        (setq hsegs (cons seg hsegs)))
      ((t2t:segment-vertical-p seg tol)
        (setq vsegs (cons seg vsegs)))
    )
  )
  (foreach h hsegs
    (foreach v vsegs
      (if (setq hit (t2t:hv-intersection h v tol))
        (setq pts (cons hit pts))
      )
    )
  )
  (setq xvals (t2t:grid-coordinate-values vsegs 'x tol)
        yvals (reverse (t2t:grid-coordinate-values hsegs 'y tol)))
  (if (and hsegs vsegs xvals yvals)
    (progn
      (list xvals yvals))
  )
)

(defun t2t:point-cell-index (pt xs ys tol / col row)
  (setq col 0)
  (while (and (cdr xs)
              (not (and (<= (- (car xs) tol) (car pt))
                        (<= (car pt) (+ (cadr xs) tol)))))
    (setq xs (cdr xs)
          col (1+ col))
  )
  (setq row 0)
  (while (and (cdr ys)
              (not (and (<= (- (cadr ys) tol) (cadr pt))
                        (<= (cadr pt) (+ (car ys) tol)))))
    (setq ys (cdr ys)
          row (1+ row))
  )
  (if (and (cdr xs) (cdr ys))
    (list row col))
)

(defun t2t:set-nth (lst idx value / out i)
  (setq out nil
        i 0)
  (foreach item lst
    (setq out (cons (if (= i idx) value item) out)
          i (1+ i))
  )
  (reverse out)
)

(defun t2t:append-cell-text (rows row col value / current rowdata)
  (setq rowdata (nth row rows)
        current (nth col rowdata)
        rowdata (t2t:set-nth rowdata col
                  (if (= "" current) value (strcat current "\\P" value))))
  (t2t:set-nth rows row rowdata)
)

(defun t2t:empty-grid (rowcount colcount / rows)
  (setq rows nil)
  (repeat rowcount
    (setq rows (cons (t2t:repeat-string "" colcount) rows))
  )
  rows
)

(defun t2t:mode-bylines (/ ss idx ent typ records segments grid xs ys rows rec pt cell ins tol unmatched)
  (setq tol nil
        records nil
        segments nil)
  (if (setq ss (ssget '((0 . "LINE,LWPOLYLINE,POLYLINE,TEXT,MTEXT"))))
    (progn
      (setq idx 0)
      (while (< idx (sslength ss))
        (setq ent (ssname ss idx)
              typ (cdr (assoc 0 (entget ent))))
        (cond
          ((wcmatch typ "LINE,LWPOLYLINE,POLYLINE")
            (setq segments (append segments (t2t:entity-segments ent))))
          ((wcmatch typ "TEXT,MTEXT")
            (setq records (cons (t2t:text-record (vlax-ename->vla-object ent)) records)))
        )
        (setq idx (1+ idx))
      )
      (setq tol (t2t:geometry-tolerance segments))
      (setq grid (t2t:grid-from-segments segments tol))
      (if (and grid
               (> (length (car grid)) 1)
               (> (length (cadr grid)) 1))
        (progn
          (setq xs (car grid)
                ys (cadr grid))
          (if (t2t:grid-cells-complete-p segments xs ys tol)
            (progn
              (setq rows (t2t:empty-grid (1- (length ys)) (1- (length xs)))
                    records (t2t:sort-records-reading records)
                    unmatched nil)
              (foreach rec records
                (setq pt (list (car rec) (cadr rec) 0.0))
                (if (setq cell (t2t:point-cell-index pt xs ys tol))
                  (setq rows
                    (t2t:append-cell-text rows (car cell) (cadr cell) (caddr rec)))
                  (setq unmatched t)
                )
              )
              (if unmatched
                (princ "\nSelected text falls outside the resolved table grid; table was not created.")
                (if (setq ins (getpoint "\nSpecify insertion point for table: "))
                  (t2t:add-table rows ins))
              )
            )
            (princ "\nSelected linework defines incomplete table cells.")
          )
        )
        (princ "\nSelected linework does not define a table grid.")
      )
    )
    (princ "\nNo linework or text selected.")
  )
)

(defun t2t:mode-bytext (/ ss objs records rows cols ins)
  (if (setq ss (ssget '((0 . "TEXT,MTEXT"))))
    (progn
      (setq objs (t2t:ss->objects ss)
            records (mapcar 't2t:text-record objs)
            rows (t2t:rows-from-records (t2t:group-records-rows records)))
      (initget 6)
      (setq cols (getint "\nOptional fixed column count <automatic>: "))
      (if cols
        (progn
          (if (t2t:any-row-longer-p rows cols)
            (princ "\nWarning: rows longer than the fixed column count will be truncated.")
          )
          (setq rows (t2t:normalize-rows rows cols)))
      )
      (if (setq ins (getpoint "\nSpecify insertion point for table: "))
        (t2t:add-table rows ins)
      )
    )
    (princ "\nNo text selected.")
  )
)

(defun t2t:pick-text-value (prompt / picked obj)
  (setq picked (entsel prompt))
  (cond
    ((null picked) nil)
    ((wcmatch (cdr (assoc 0 (entget (car picked)))) "*TEXT")
      (setq obj (vlax-ename->vla-object (car picked)))
      (t2t:text-string obj))
    (t
      (princ "\nSelected object is not TEXT or MTEXT.")
      :retry)
  )
)

(defun t2t:select-table (/ ent picked obj)
  (while
    (progn
      (setq picked (entsel "\nSelect table: ")
            ent (if picked (car picked))
            obj nil)
      (cond
        ((null ent) nil)
        ((t2t:table-object-p (vlax-ename->vla-object ent))
          (setq obj (vlax-ename->vla-object ent))
          nil)
        (t
          (princ "\nSelected object is not a table.")
          t)
      )
    )
  )
  obj
)

(defun t2t:select-text (/ ent obj)
  (while
    (progn
      (setq ent (car (entsel "\nSelect text: ")))
      (cond
        ((null ent) nil)
        ((wcmatch (cdr (assoc 0 (entget ent))) "*TEXT")
          (setq obj (vlax-ename->vla-object ent))
          nil)
        (t (princ "\nSelected object is not TEXT or MTEXT.") t)
      )
    )
  )
  (if obj (list ent obj))
)

(defun t2t:onebyone-manual (/ rows row action value ins done)
  (setq rows nil
        row nil
        done nil)
  (while (not done)
    (initget "NextRow")
    (setq action (getkword "\nChoose [NextRow] or press Enter to pick text <finish with empty pick>: "))
    (cond
      ((= action "NextRow")
        (if row
          (setq rows (append rows (list row))
                row nil)
          (princ "\nCurrent row is empty.")
        ))
      (t
        (setq value (t2t:pick-text-value "\nSelect text <finish>: "))
        (cond
          ((null value) (setq done t))
          ((= value :retry) nil)
          (t (setq row (append row (list value))))
        ))
    )
  )
  (if row
    (setq rows (append rows (list row)))
  )
  (if (and rows
           (setq ins (getpoint "\nSpecify insertion point for table: ")))
    (t2t:add-table rows ins)
  )
)

(defun t2t:onebyone-fixed (/ cols rows row value ins done)
  (initget 7)
  (setq cols (getint "\nFixed column count: ")
        rows nil
        row nil
        done nil)
  (while (not done)
    (setq value (t2t:pick-text-value "\nSelect text <finish>: "))
    (cond
      ((null value) (setq done t))
      ((= value :retry) nil)
      (t
        (setq row (append row (list value)))
        (if (= cols (length row))
          (setq rows (append rows (list row))
                row nil)
        ))
    )
  )
  (if row
    (setq rows (append rows (list (t2t:normalize-row row cols))))
  )
  (if (and rows
           (setq ins (getpoint "\nSpecify insertion point for table: ")))
    (t2t:add-table (t2t:normalize-rows rows cols) ins)
  )
)

(defun t2t:mode-onebyone (/ submode)
  (initget "ManualRows FixedColumns")
  (setq submode
    (cond
      ((getkword "\nOneByOne mode [ManualRows/FixedColumns] <ManualRows>: "))
      ("ManualRows")
    )
  )
  (cond
    ((= submode "ManualRows") (t2t:onebyone-manual))
    ((= submode "FixedColumns") (t2t:onebyone-fixed))
  )
)

(defun t2t:complete-text-to-cell-write (write-result text-ent)
  (if (vl-catch-all-error-p write-result)
    nil
    (progn
      (entdel text-ent)
      t
    )
  )
)

(defun t2t:prompt-cell-indexes (/ row col)
  (if (and
        (progn (initget 6) (setq row (getint "\nTarget row number <1-based>: ")))
        (progn (initget 6) (setq col (getint "\nTarget column number <1-based>: "))))
    (list row col)
  )
)

(defun t2t:table-cell-at-point (table pt / row col result viewdir)
  (if (vlax-method-applicable-p table 'hittest)
    (progn
      (setq viewdir (trans (getvar 'viewdir) 1 0 t)
            result
              (vl-catch-all-apply
                'vla-hittest
                (list table (vlax-3d-point (trans pt 1 0)) (vlax-3d-point viewdir) 'row 'col)))
      (if (and (not (vl-catch-all-error-p result))
               (not (eq :vlax-false result))
               (numberp row)
               (numberp col))
        (list (1+ row) (1+ col))
      ))
  )
)

(defun t2t:select-table-cell (/ picked ent obj cell indexes action)
  (while
    (progn
      (setq picked (entsel "\nSelect target table cell: ")
            ent (if picked (car picked))
            obj nil
            cell nil)
      (cond
        ((null ent) nil)
        ((not (t2t:table-object-p (vlax-ename->vla-object ent)))
          (princ "\nSelected object is not a table.")
          t)
        (t
          (setq obj (vlax-ename->vla-object ent)
                cell (t2t:table-cell-at-point obj (cadr picked)))
          (if cell
            nil
            (progn
              (princ "\nCould not resolve the picked cell.")
              (initget "RowColumn Cancel")
              (setq action (getkword "\nUse [RowColumn/Cancel] <Cancel>: "))
              (if (and action (= action "RowColumn"))
                (progn
                  (setq indexes (t2t:prompt-cell-indexes))
                  (if indexes
                    (progn
                      (setq cell indexes)
                      nil)
                    nil))
                (progn
                  (setq obj nil)
                  nil)))))
      )
    )
  )
  (if (and obj cell)
    (list obj (car cell) (cadr cell))
  )
)

(defun t2t:write-text-to-cell (table row col text-ent text-obj / value result)
  (setq value (t2t:text-string text-obj)
        result (vl-catch-all-apply 'vla-settext (list table (1- row) (1- col) value)))
  (t2t:complete-text-to-cell-write result text-ent)
)

(defun t2t:text-to-cell (/ target picked)
  (if (and
        (setq target (t2t:select-table-cell))
        (setq picked (t2t:select-text)))
    (if (t2t:write-text-to-cell (car target) (cadr target) (caddr target) (car picked) (cadr picked))
      (princ "\nText written to cell.")
      (princ "\nTextToCell cancelled.")
    )
    (princ "\nTextToCell cancelled.")
  )
)

(defun c:Text2Tabel (/ *error* doc mode)
  (setq doc (t2t:acdoc))
  (defun *error* (msg)
    (t2t:end-undo doc)
    (if (not (wcmatch (strcase msg t) "*break,*cancel*,*exit*"))
      (princ (strcat "\nError: " msg))
    )
    (princ)
  )
  (initget "ByLines ByText OneByOne TextToCell")
  (setq mode
    (cond
      ((getkword "\nText2Tabel mode [ByLines/ByText/OneByOne/TextToCell] <ByLines>: "))
      ("ByLines")
    )
  )
  (t2t:start-undo doc)
  (cond
    ((= mode "ByLines") (t2t:mode-bylines))
    ((= mode "ByText") (t2t:mode-bytext))
    ((= mode "OneByOne") (t2t:mode-onebyone))
    ((= mode "TextToCell") (t2t:text-to-cell))
  )
  (t2t:end-undo doc)
  (princ)
)

(princ "\n:: Text2Tabel.lsp loaded. Type Text2Tabel to run. ::")
(princ)
